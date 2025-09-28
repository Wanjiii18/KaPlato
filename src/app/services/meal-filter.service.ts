import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AllergenDetectionService } from './allergen-detection.service';

export interface MealFilterOptions {
  maxCalories?: number;
  minCalories?: number;
  maxBudget?: number;
  minBudget?: number;
  allergenSafe?: boolean;
  specificAllergens?: string[];
  maxDistance?: number; // for karenderia
  category?: string;
  spicyLevel?: string;
  searchQuery?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  sortBy?: 'price' | 'calories' | 'rating' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface FilterStats {
  totalMeals: number;
  filteredMeals: number;
  averageCalories: number;
  averagePrice: number;
  safeForUser: number;
}

@Injectable({
  providedIn: 'root'
})
export class MealFilterService {

  constructor(
    private userService: UserService,
    private allergenService: AllergenDetectionService
  ) {}

  /**
   * Filter meals based on multiple criteria
   */
  async filterMeals(meals: any[], filters: MealFilterOptions): Promise<any[]> {
    console.log('🔍 Filtering meals with criteria:', filters);
    
    let filteredMeals = [...meals];
    
    // Apply search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filteredMeals = filteredMeals.filter(meal => 
        meal.name.toLowerCase().includes(query) ||
        meal.description?.toLowerCase().includes(query) ||
        meal.category?.toLowerCase().includes(query) ||
        meal.karenderia_name?.toLowerCase().includes(query)
      );
    }

    // Apply calorie filters
    if (filters.maxCalories) {
      filteredMeals = filteredMeals.filter(meal => 
        (meal.calories || 0) <= filters.maxCalories!
      );
    }
    
    if (filters.minCalories) {
      filteredMeals = filteredMeals.filter(meal => 
        (meal.calories || 0) >= filters.minCalories!
      );
    }

    // Apply budget filters
    if (filters.maxBudget) {
      filteredMeals = filteredMeals.filter(meal => 
        (meal.price || 0) <= filters.maxBudget!
      );
    }
    
    if (filters.minBudget) {
      filteredMeals = filteredMeals.filter(meal => 
        (meal.price || 0) >= filters.minBudget!
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filteredMeals = filteredMeals.filter(meal => 
        meal.category?.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // Apply spicy level filter
    if (filters.spicyLevel && filters.spicyLevel !== 'all') {
      filteredMeals = filteredMeals.filter(meal => 
        meal.spicyLevel?.toLowerCase() === filters.spicyLevel?.toLowerCase()
      );
    }

    // Apply availability filter - only show available items to customers
    filteredMeals = filteredMeals.filter(meal => 
      meal.available === true || meal.available === undefined
    );

    // Apply dietary filters
    if (filters.isVegetarian) {
      filteredMeals = filteredMeals.filter(meal => 
        meal.isVegetarian === true
      );
    }
    
    if (filters.isVegan) {
      filteredMeals = filteredMeals.filter(meal => 
        meal.isVegan === true
      );
    }

    // Apply allergen safety filter
    if (filters.allergenSafe) {
      const userProfile = await this.userService.getCurrentUserProfile();
      if (userProfile?.allergens && Array.isArray(userProfile.allergens) && userProfile.allergens.length > 0) {
        const safeMeals = [];
        
        for (const meal of filteredMeals) {
          const ingredients = meal.ingredients || [meal.name]; // Use meal name if no ingredients
          const safetyAnalysis = this.allergenService.analyzeMealSafety(ingredients, meal.name);
          if (safetyAnalysis.isSafe) {
            safeMeals.push(meal);
          }
        }
        
        filteredMeals = safeMeals;
      }
    }

    // Apply specific allergen avoidance
    if (filters.specificAllergens && filters.specificAllergens.length > 0) {
      const safeMeals = [];
      
      for (const meal of filteredMeals) {
        const ingredients = meal.ingredients || [meal.name]; // Use meal name if no ingredients
        // Create a temporary allergen service instance with specific allergens
        let isSafe = true;
        
        for (const allergen of filters.specificAllergens) {
          const foundIngredients = this.checkAllergenInMeal(allergen, ingredients);
          if (foundIngredients.length > 0) {
            isSafe = false;
            break;
          }
        }
        
        if (isSafe) {
          safeMeals.push(meal);
        }
      }
      
      filteredMeals = safeMeals;
    }

    // Apply distance filter (for karenderia)
    if (filters.maxDistance && filteredMeals.length > 0) {
      // This would require karenderia location data
      filteredMeals = filteredMeals.filter(meal => {
        // Placeholder - would need actual distance calculation
        const distance = meal.karenderia_distance || 0;
        return distance <= filters.maxDistance!;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredMeals = this.sortMeals(filteredMeals, filters.sortBy, filters.sortOrder || 'asc');
    }

    console.log(`✅ Filtered ${meals.length} meals down to ${filteredMeals.length} results`);
    return filteredMeals;
  }

  /**
   * Sort meals by specified criteria
   */
  private sortMeals(meals: any[], sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
    return meals.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'calories':
          comparison = (a.calories || 0) - (b.calories || 0);
          break;
        case 'rating':
          comparison = (a.average_rating || 0) - (b.average_rating || 0);
          break;
        case 'distance':
          comparison = (a.karenderia_distance || 0) - (b.karenderia_distance || 0);
          break;
        case 'popularity':
          comparison = (a.total_reviews || 0) - (b.total_reviews || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get filter statistics
   */
  getFilterStats(originalMeals: any[], filteredMeals: any[]): FilterStats {
    const totalMeals = originalMeals.length;
    const filteredCount = filteredMeals.length;
    
    const avgCalories = filteredMeals.length > 0 
      ? filteredMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / filteredMeals.length
      : 0;
      
    const avgPrice = filteredMeals.length > 0
      ? filteredMeals.reduce((sum, meal) => sum + (meal.price || 0), 0) / filteredMeals.length
      : 0;

    return {
      totalMeals,
      filteredMeals: filteredCount,
      averageCalories: Math.round(avgCalories),
      averagePrice: Math.round(avgPrice * 100) / 100,
      safeForUser: filteredCount // Simplified for now
    };
  }

  /**
   * Get popular filter presets
   */
  getFilterPresets(): { [key: string]: MealFilterOptions } {
    return {
      'budget-friendly': {
        maxBudget: 150,
        sortBy: 'price',
        sortOrder: 'asc'
      },
      'low-calorie': {
        maxCalories: 300,
        sortBy: 'calories',
        sortOrder: 'asc'
      },
      'high-protein': {
        minCalories: 400,
        sortBy: 'rating',
        sortOrder: 'desc'
      },
      'allergen-safe': {
        allergenSafe: true,
        sortBy: 'rating',
        sortOrder: 'desc'
      },
      'vegetarian': {
        isVegetarian: true,
        sortBy: 'popularity',
        sortOrder: 'desc'
      },
      'nearby': {
        maxDistance: 5,
        sortBy: 'distance',
        sortOrder: 'asc'
      }
    };
  }

  /**
   * Reset all filters
   */
  getDefaultFilters(): MealFilterOptions {
    return {
      sortBy: 'popularity',
      sortOrder: 'desc'
    };
  }

  /**
   * Check if allergen is present in meal ingredients
   */
  private checkAllergenInMeal(allergen: string, ingredients: string[]): string[] {
    const foundIngredients: string[] = [];
    const allergenLower = allergen.toLowerCase();
    
    for (const ingredient of ingredients) {
      const ingredientLower = ingredient.toLowerCase();
      if (ingredientLower.includes(allergenLower) || 
          this.checkCommonAllergenTerms(allergenLower, ingredientLower)) {
        foundIngredients.push(ingredient);
      }
    }
    
    return foundIngredients;
  }

  /**
   * Check common allergen terms (simplified version)
   */
  private checkCommonAllergenTerms(allergen: string, ingredient: string): boolean {
    const allergenMap: { [key: string]: string[] } = {
      'dairy': ['milk', 'cheese', 'butter', 'cream', 'gatas'],
      'nuts': ['almond', 'peanut', 'cashew', 'walnut'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'hipon', 'alimango'],
      'soy': ['soy', 'soya', 'tofu', 'toyo'],
      'fish': ['fish', 'isda', 'bangus', 'tilapia', 'patis'],
      'eggs': ['egg', 'itlog'],
      'wheat': ['wheat', 'flour', 'bread', 'harina']
    };

    const terms = allergenMap[allergen] || [];
    return terms.some(term => ingredient.includes(term));
  }
}
