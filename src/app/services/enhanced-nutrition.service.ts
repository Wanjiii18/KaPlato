import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SpoonacularService } from './spoonacular.service';
import { environment } from '../../environments/environment';

// Enhanced interfaces for nutrition tracking
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminA?: number;
  saturatedFat?: number;
  cholesterol?: number;
  potassium?: number;
}

export interface MenuItemNutrition {
  id: string;
  name: string;
  nutrition: NutritionData;
  allergens: string[];
  spiceLevel: 'mild' | 'medium' | 'spicy' | 'very_spicy';
  dietaryTags: string[];
  servingSize: string;
  lastUpdated: Date;
}

export interface FilipinoDishNutrition {
  [key: string]: NutritionData & {
    allergens: string[];
    spiceLevel: 'mild' | 'medium' | 'spicy' | 'very_spicy';
    dietaryTags: string[];
    servingSize: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedNutritionService {
  private apiKey = environment.spoonacular.apiKey;
  private baseUrl = environment.spoonacular.baseUrl;

  // BehaviorSubjects for reactive data
  private nutritionCacheSubject = new BehaviorSubject<MenuItemNutrition[]>([]);
  public nutritionCache$ = this.nutritionCacheSubject.asObservable();

  // Comprehensive Filipino food nutrition database
  private filipinoDishDatabase: FilipinoDishNutrition = {
    'adobo': {
      calories: 350, protein: 25, carbs: 15, fat: 22, fiber: 2,
      sodium: 890, sugar: 8, calcium: 35, iron: 2.1, vitaminC: 12,
      allergens: ['soy'], spiceLevel: 'mild',
      dietaryTags: ['gluten-free'], servingSize: '1 cup (250g)'
    },
    'lechon kawali': {
      calories: 480, protein: 28, carbs: 8, fat: 38, fiber: 0,
      sodium: 650, sugar: 2, calcium: 20, iron: 1.8, vitaminC: 0,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '150g'
    },
    'sinigang na baboy': {
      calories: 220, protein: 18, carbs: 12, fat: 12, fiber: 3,
      sodium: 1200, sugar: 6, calcium: 45, iron: 1.5, vitaminC: 25,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 bowl (300ml)'
    },
    'bicol express': {
      calories: 380, protein: 20, carbs: 15, fat: 28, fiber: 4,
      sodium: 750, sugar: 8, calcium: 120, iron: 2.0, vitaminC: 45,
      allergens: ['dairy'], spiceLevel: 'very_spicy',
      dietaryTags: ['gluten-free'], servingSize: '1 cup (200g)'
    },
    'kare-kare': {
      calories: 420, protein: 22, carbs: 25, fat: 28, fiber: 5,
      sodium: 580, sugar: 12, calcium: 80, iron: 2.8, vitaminC: 15,
      allergens: ['peanuts'], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 cup (250g)'
    },
    'lumpia shanghai': {
      calories: 180, protein: 8, carbs: 20, fat: 8, fiber: 2,
      sodium: 450, sugar: 3, calcium: 25, iron: 1.2, vitaminC: 5,
      allergens: ['eggs', 'gluten'], spiceLevel: 'mild',
      dietaryTags: [], servingSize: '3 pieces (90g)'
    },
    'pancit canton': {
      calories: 280, protein: 12, carbs: 45, fat: 8, fiber: 3,
      sodium: 920, sugar: 6, calcium: 40, iron: 2.5, vitaminC: 20,
      allergens: ['gluten', 'soy'], spiceLevel: 'mild',
      dietaryTags: [], servingSize: '1 cup (200g)'
    },
    'sisig': {
      calories: 450, protein: 24, carbs: 12, fat: 35, fiber: 2,
      sodium: 780, sugar: 4, calcium: 30, iron: 3.2, vitaminC: 15,
      allergens: ['eggs'], spiceLevel: 'medium',
      dietaryTags: ['gluten-free'], servingSize: '1 plate (200g)'
    },
    'tinola': {
      calories: 160, protein: 15, carbs: 8, fat: 8, fiber: 2,
      sodium: 650, sugar: 5, calcium: 35, iron: 1.0, vitaminC: 30,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 bowl (300ml)'
    },
    'bulalo': {
      calories: 280, protein: 20, carbs: 10, fat: 18, fiber: 3,
      sodium: 850, sugar: 6, calcium: 60, iron: 2.2, vitaminC: 25,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 bowl (400ml)'
    },
    'laing': {
      calories: 200, protein: 8, carbs: 18, fat: 12, fiber: 6,
      sodium: 420, sugar: 5, calcium: 180, iron: 2.8, vitaminC: 20,
      allergens: ['dairy'], spiceLevel: 'medium',
      dietaryTags: ['gluten-free'], servingSize: '1 cup (200g)'
    },
    'pinakbet': {
      calories: 120, protein: 6, carbs: 15, fat: 5, fiber: 5,
      sodium: 680, sugar: 8, calcium: 55, iron: 1.8, vitaminC: 35,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free'], servingSize: '1 cup (180g)'
    },
    'fried rice': {
      calories: 250, protein: 8, carbs: 35, fat: 10, fiber: 1,
      sodium: 780, sugar: 2, calcium: 25, iron: 1.5, vitaminC: 8,
      allergens: ['eggs', 'soy'], spiceLevel: 'mild',
      dietaryTags: [], servingSize: '1 cup (200g)'
    },
    'menudo': {
      calories: 320, protein: 18, carbs: 20, fat: 20, fiber: 3,
      sodium: 720, sugar: 10, calcium: 40, iron: 2.5, vitaminC: 25,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 cup (200g)'
    },
    'caldereta': {
      calories: 380, protein: 22, carbs: 18, fat: 25, fiber: 4,
      sodium: 820, sugar: 12, calcium: 50, iron: 2.8, vitaminC: 30,
      allergens: ['dairy'], spiceLevel: 'medium',
      dietaryTags: ['gluten-free'], servingSize: '1 cup (220g)'
    },
    'mechado': {
      calories: 290, protein: 20, carbs: 15, fat: 18, fiber: 2,
      sodium: 680, sugar: 8, calcium: 35, iron: 2.2, vitaminC: 20,
      allergens: [], spiceLevel: 'mild',
      dietaryTags: ['gluten-free', 'dairy-free'], servingSize: '1 cup (200g)'
    }
  };

  constructor(
    private http: HttpClient,
    private spoonacularService: SpoonacularService
  ) {
    this.loadNutritionCache();
  }

  // Load cached nutrition data from localStorage
  private loadNutritionCache(): void {
    try {
      const cached = localStorage.getItem('nutrition_cache');
      if (cached) {
        const nutritionData = JSON.parse(cached);
        this.nutritionCacheSubject.next(nutritionData);
      }
    } catch (error) {
      console.error('Error loading nutrition cache:', error);
    }
  }

  // Cache nutrition data to localStorage
  private cacheNutritionData(data: MenuItemNutrition[]): void {
    try {
      localStorage.setItem('nutrition_cache', JSON.stringify(data));
      this.nutritionCacheSubject.next(data);
    } catch (error) {
      console.error('Error caching nutrition data:', error);
    }
  }

  // Get comprehensive nutrition for a menu item
  async getMenuItemNutrition(itemName: string, ingredients?: string[]): Promise<MenuItemNutrition | null> {
    try {
      // Check cache first
      const cached = this.getCachedNutrition(itemName);
      if (cached) {
        return cached;
      }

      // Try Spoonacular API first
      const spoonacularNutrition = await this.getSpoonacularNutrition(itemName, ingredients);
      if (spoonacularNutrition) {
        await this.addToNutritionCache(spoonacularNutrition);
        return spoonacularNutrition;
      }

      // Fallback to Filipino food database
      const filipinoNutrition = this.getFilipinoDishNutrition(itemName);
      if (filipinoNutrition) {
        await this.addToNutritionCache(filipinoNutrition);
        return filipinoNutrition;
      }

      // Final fallback - estimated nutrition
      const estimatedNutrition = this.getEstimatedNutrition(itemName);
      await this.addToNutritionCache(estimatedNutrition);
      return estimatedNutrition;

    } catch (error) {
      console.error('Error getting menu item nutrition:', error);
      return null;
    }
  }

  // Get nutrition from Spoonacular API
  private async getSpoonacularNutrition(itemName: string, ingredients?: string[]): Promise<MenuItemNutrition | null> {
    try {
      if (ingredients && ingredients.length > 0) {
        // For items with known ingredients, analyze the recipe
        const recipeAnalysis = await this.analyzeRecipeNutrition(ingredients);
        return this.formatSpoonacularNutrition(itemName, recipeAnalysis);
      } else {
        // Search for similar food items
        const searchResults = await this.spoonacularService.searchRecipes(itemName, undefined, undefined, undefined, 1).toPromise();
        if (searchResults && searchResults.results.length > 0) {
          const recipe = searchResults.results[0];
          const nutritionData = await this.spoonacularService.getRecipeNutrition(recipe.id).toPromise();
          return this.formatSpoonacularRecipeNutrition(itemName, nutritionData, recipe);
        }
      }
    } catch (error) {
      console.error('Spoonacular API error:', error);
    }
    return null;
  }

  // Analyze recipe nutrition using ingredients
  private analyzeRecipeNutrition(ingredients: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      // Since Spoonacular doesn't have a direct recipe analysis endpoint for custom ingredients,
      // we'll use the nutrition information from individual ingredients
      const promises = ingredients.map(ingredient => 
        this.spoonacularService.searchIngredients(ingredient, 1).toPromise()
      );

      Promise.all(promises).then(results => {
        // Aggregate nutrition from all ingredients
        const totalNutrition = {
          calories: 0, protein: 0, carbs: 0, fat: 0,
          fiber: 0, sodium: 0, sugar: 0
        };

        results.forEach(ingredientResults => {
          if (ingredientResults && ingredientResults.length > 0) {
            // Estimate nutrition contribution (simplified)
            totalNutrition.calories += 50; // Base estimate per ingredient
            totalNutrition.protein += 3;
            totalNutrition.carbs += 8;
            totalNutrition.fat += 2;
          }
        });

        resolve(totalNutrition);
      }).catch(reject);
    });
  }

  // Format Spoonacular nutrition data
  private formatSpoonacularNutrition(itemName: string, data: any): MenuItemNutrition {
    return {
      id: `spoon_${Date.now()}`,
      name: itemName,
      nutrition: {
        calories: Math.round(data.calories || 0),
        protein: Math.round(data.protein || 0),
        carbs: Math.round(data.carbs || 0),
        fat: Math.round(data.fat || 0),
        fiber: Math.round(data.fiber || 0),
        sodium: Math.round(data.sodium || 0),
        sugar: Math.round(data.sugar || 0)
      },
      allergens: this.detectAllergens(itemName),
      spiceLevel: this.detectSpiceLevel(itemName),
      dietaryTags: this.detectDietaryTags(itemName),
      servingSize: '1 serving',
      lastUpdated: new Date()
    };
  }

  // Format Spoonacular recipe nutrition data
  private formatSpoonacularRecipeNutrition(itemName: string, nutritionData: any, recipe: any): MenuItemNutrition {
    const nutrients = nutritionData.nutrients || [];
    
    return {
      id: `spoon_recipe_${recipe.id}`,
      name: itemName,
      nutrition: {
        calories: Math.round(nutritionData.calories || 0),
        protein: Math.round(this.findNutrient(nutrients, 'Protein') || 0),
        carbs: Math.round(this.findNutrient(nutrients, 'Carbohydrates') || 0),
        fat: Math.round(this.findNutrient(nutrients, 'Fat') || 0),
        fiber: Math.round(this.findNutrient(nutrients, 'Fiber') || 0),
        sodium: Math.round(this.findNutrient(nutrients, 'Sodium') || 0),
        sugar: Math.round(this.findNutrient(nutrients, 'Sugar') || 0),
        calcium: Math.round(this.findNutrient(nutrients, 'Calcium') || 0),
        iron: Math.round(this.findNutrient(nutrients, 'Iron') || 0),
        vitaminC: Math.round(this.findNutrient(nutrients, 'Vitamin C') || 0)
      },
      allergens: this.extractSpoonacularAllergens(recipe),
      spiceLevel: this.detectSpiceLevel(itemName),
      dietaryTags: this.extractSpoonacularDietaryTags(recipe),
      servingSize: `${recipe.servings} serving${recipe.servings !== 1 ? 's' : ''}`,
      lastUpdated: new Date()
    };
  }

  // Find specific nutrient from Spoonacular nutrients array
  private findNutrient(nutrients: any[], name: string): number {
    const nutrient = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? nutrient.amount : 0;
  }

  // Extract allergens from Spoonacular recipe
  private extractSpoonacularAllergens(recipe: any): string[] {
    const allergens: string[] = [];
    
    if (!recipe.dairyFree) allergens.push('dairy');
    if (!recipe.glutenFree) allergens.push('gluten');
    if (!recipe.vegan) allergens.push('animal products');
    
    // Check ingredients for common allergens
    if (recipe.extendedIngredients) {
      recipe.extendedIngredients.forEach((ing: any) => {
        const name = ing.name.toLowerCase();
        if (name.includes('peanut')) allergens.push('peanuts');
        if (name.includes('tree nut') || name.includes('almond') || name.includes('walnut')) {
          allergens.push('tree nuts');
        }
        if (name.includes('shellfish') || name.includes('shrimp') || name.includes('crab')) {
          allergens.push('shellfish');
        }
        if (name.includes('fish') && !name.includes('shellfish')) allergens.push('fish');
        if (name.includes('egg')) allergens.push('eggs');
        if (name.includes('soy')) allergens.push('soy');
        if (name.includes('sesame')) allergens.push('sesame');
      });
    }
    
    return [...new Set(allergens)];
  }

  // Extract dietary tags from Spoonacular recipe
  private extractSpoonacularDietaryTags(recipe: any): string[] {
    const tags: string[] = [];
    
    if (recipe.vegetarian) tags.push('vegetarian');
    if (recipe.vegan) tags.push('vegan');
    if (recipe.glutenFree) tags.push('gluten-free');
    if (recipe.dairyFree) tags.push('dairy-free');
    if (recipe.veryHealthy) tags.push('healthy');
    if (recipe.cheap) tags.push('budget-friendly');
    
    return tags;
  }

  // Get nutrition from Filipino food database
  private getFilipinoDishNutrition(itemName: string): MenuItemNutrition | null {
    const normalizedName = itemName.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Direct match
    if (this.filipinoDishDatabase[normalizedName]) {
      const dishData = this.filipinoDishDatabase[normalizedName];
      return {
        id: `filipino_${normalizedName}`,
        name: itemName,
        nutrition: {
          calories: dishData.calories,
          protein: dishData.protein,
          carbs: dishData.carbs,
          fat: dishData.fat,
          fiber: dishData.fiber,
          sodium: dishData.sodium,
          sugar: dishData.sugar,
          calcium: dishData.calcium,
          iron: dishData.iron,
          vitaminC: dishData.vitaminC
        },
        allergens: dishData.allergens,
        spiceLevel: dishData.spiceLevel,
        dietaryTags: dishData.dietaryTags,
        servingSize: dishData.servingSize,
        lastUpdated: new Date()
      };
    }

    // Partial match
    for (const [key, data] of Object.entries(this.filipinoDishDatabase)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return {
          id: `filipino_partial_${key}`,
          name: itemName,
          nutrition: {
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
            fiber: data.fiber,
            sodium: data.sodium,
            sugar: data.sugar,
            calcium: data.calcium,
            iron: data.iron,
            vitaminC: data.vitaminC
          },
          allergens: data.allergens,
          spiceLevel: data.spiceLevel,
          dietaryTags: data.dietaryTags,
          servingSize: data.servingSize,
          lastUpdated: new Date()
        };
      }
    }

    return null;
  }

  // Generate estimated nutrition based on food type
  private getEstimatedNutrition(itemName: string): MenuItemNutrition {
    const name = itemName.toLowerCase();
    let nutrition: NutritionData;
    let allergens: string[] = [];
    let spiceLevel: 'mild' | 'medium' | 'spicy' | 'very_spicy' = 'mild';
    let dietaryTags: string[] = [];

    if (name.includes('rice') || name.includes('kanin')) {
      nutrition = { calories: 130, protein: 3, carbs: 28, fat: 0, fiber: 0.4, sodium: 1 };
      dietaryTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
    } else if (name.includes('pork') || name.includes('baboy')) {
      nutrition = { calories: 400, protein: 25, carbs: 5, fat: 30, fiber: 1, sodium: 650 };
      allergens = [];
      dietaryTags = ['gluten-free', 'dairy-free'];
    } else if (name.includes('chicken') || name.includes('manok')) {
      nutrition = { calories: 300, protein: 28, carbs: 0, fat: 18, fiber: 0, sodium: 580 };
      allergens = [];
      dietaryTags = ['gluten-free', 'dairy-free'];
    } else if (name.includes('fish') || name.includes('isda')) {
      nutrition = { calories: 250, protein: 22, carbs: 0, fat: 15, fiber: 0, sodium: 450 };
      allergens = ['fish'];
      dietaryTags = ['gluten-free', 'dairy-free'];
    } else if (name.includes('vegetable') || name.includes('gulay')) {
      nutrition = { calories: 50, protein: 2, carbs: 10, fat: 0, fiber: 3, sodium: 200 };
      allergens = [];
      dietaryTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
    } else if (name.includes('noodle') || name.includes('pancit')) {
      nutrition = { calories: 280, protein: 12, carbs: 45, fat: 8, fiber: 3, sodium: 920 };
      allergens = ['gluten', 'soy'];
      dietaryTags = [];
    } else {
      // Default estimation
      nutrition = { calories: 250, protein: 15, carbs: 20, fat: 12, fiber: 2, sodium: 600 };
    }

    // Detect spice level from name
    spiceLevel = this.detectSpiceLevel(itemName);

    return {
      id: `estimated_${Date.now()}`,
      name: itemName,
      nutrition,
      allergens,
      spiceLevel,
      dietaryTags,
      servingSize: '1 serving (estimated)',
      lastUpdated: new Date()
    };
  }

  // Detect allergens from item name
  private detectAllergens(itemName: string): string[] {
    const name = itemName.toLowerCase();
    const allergens: string[] = [];

    if (name.includes('egg') || name.includes('itlog')) allergens.push('eggs');
    if (name.includes('milk') || name.includes('cheese') || name.includes('gatas')) allergens.push('dairy');
    if (name.includes('peanut') || name.includes('mani')) allergens.push('peanuts');
    if (name.includes('shrimp') || name.includes('hipon') || name.includes('crab') || name.includes('alimango')) allergens.push('shellfish');
    if (name.includes('fish') || name.includes('isda')) allergens.push('fish');
    if (name.includes('soy') || name.includes('toyo')) allergens.push('soy');
    if (name.includes('wheat') || name.includes('flour') || name.includes('bread')) allergens.push('gluten');

    return allergens;
  }

  // Detect spice level from item name
  private detectSpiceLevel(itemName: string): 'mild' | 'medium' | 'spicy' | 'very_spicy' {
    const name = itemName.toLowerCase();

    if (name.includes('bicol') || name.includes('labuyo') || name.includes('very spicy')) {
      return 'very_spicy';
    } else if (name.includes('spicy') || name.includes('maanghang') || name.includes('chili')) {
      return 'spicy';
    } else if (name.includes('medium') || name.includes('slight')) {
      return 'medium';
    }

    return 'mild';
  }

  // Detect dietary tags from item name
  private detectDietaryTags(itemName: string): string[] {
    const name = itemName.toLowerCase();
    const tags: string[] = [];

    if (name.includes('vegetable') || name.includes('gulay') || name.includes('salad')) {
      tags.push('vegetarian');
      if (!name.includes('meat') && !name.includes('fish') && !name.includes('egg') && !name.includes('dairy')) {
        tags.push('vegan');
      }
    }

    if (!name.includes('wheat') && !name.includes('flour') && !name.includes('bread') && !name.includes('noodle')) {
      tags.push('gluten-free');
    }

    if (!name.includes('milk') && !name.includes('cheese') && !name.includes('cream')) {
      tags.push('dairy-free');
    }

    return tags;
  }

  // Get cached nutrition data
  private getCachedNutrition(itemName: string): MenuItemNutrition | null {
    const cached = this.nutritionCacheSubject.value;
    const normalizedName = itemName.toLowerCase();
    
    return cached.find(item => 
      item.name.toLowerCase() === normalizedName ||
      item.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(item.name.toLowerCase())
    ) || null;
  }

  // Add to nutrition cache
  private async addToNutritionCache(nutrition: MenuItemNutrition): Promise<void> {
    const currentCache = this.nutritionCacheSubject.value;
    const existingIndex = currentCache.findIndex(item => item.name.toLowerCase() === nutrition.name.toLowerCase());
    
    if (existingIndex >= 0) {
      currentCache[existingIndex] = nutrition;
    } else {
      currentCache.push(nutrition);
    }

    this.cacheNutritionData(currentCache);
  }

  // Check allergen compatibility with user profile
  checkAllergenCompatibility(menuItemNutrition: MenuItemNutrition, userAllergens: string[]): {
    isSafe: boolean;
    warnings: string[];
    conflictingAllergens: string[];
  } {
    const conflictingAllergens = menuItemNutrition.allergens.filter(allergen =>
      userAllergens.some(userAllergen => 
        userAllergen.toLowerCase().includes(allergen.toLowerCase()) ||
        allergen.toLowerCase().includes(userAllergen.toLowerCase())
      )
    );

    return {
      isSafe: conflictingAllergens.length === 0,
      warnings: conflictingAllergens.map(allergen => 
        `Contains ${allergen} - may not be suitable due to your allergen profile`
      ),
      conflictingAllergens
    };
  }

  // Calculate daily nutrition percentage
  calculateDailyNutritionPercentage(nutrition: NutritionData, targetCalories: number = 2000): any {
    return {
      calories: Math.round((nutrition.calories / targetCalories) * 100),
      protein: Math.round((nutrition.protein / 50) * 100), // 50g daily target
      carbs: Math.round((nutrition.carbs / 300) * 100), // 300g daily target
      fat: Math.round((nutrition.fat / 65) * 100), // 65g daily target
      fiber: Math.round(((nutrition.fiber || 0) / 25) * 100), // 25g daily target
      sodium: Math.round(((nutrition.sodium || 0) / 2300) * 100) // 2300mg daily limit
    };
  }

  // Get nutrition summary for multiple items
  calculateTotalNutrition(items: MenuItemNutrition[]): NutritionData {
    return items.reduce((total, item) => ({
      calories: total.calories + item.nutrition.calories,
      protein: total.protein + item.nutrition.protein,
      carbs: total.carbs + item.nutrition.carbs,
      fat: total.fat + item.nutrition.fat,
      fiber: (total.fiber || 0) + (item.nutrition.fiber || 0),
      sodium: (total.sodium || 0) + (item.nutrition.sodium || 0),
      sugar: (total.sugar || 0) + (item.nutrition.sugar || 0),
      calcium: (total.calcium || 0) + (item.nutrition.calcium || 0),
      iron: (total.iron || 0) + (item.nutrition.iron || 0),
      vitaminC: (total.vitaminC || 0) + (item.nutrition.vitaminC || 0)
    }), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sodium: 0, sugar: 0, calcium: 0, iron: 0, vitaminC: 0
    });
  }

  // Clear nutrition cache
  clearNutritionCache(): void {
    localStorage.removeItem('nutrition_cache');
    this.nutritionCacheSubject.next([]);
  }

  // Get all Filipino dishes for browsing
  getAllFilipinoDishes(): string[] {
    return Object.keys(this.filipinoDishDatabase);
  }

  // Search Filipino dishes by criteria
  searchFilipinoDishes(criteria: {
    spiceLevel?: string;
    allergenFree?: string[];
    maxCalories?: number;
    dietaryTags?: string[];
  }): string[] {
    return Object.entries(this.filipinoDishDatabase)
      .filter(([name, data]) => {
        if (criteria.spiceLevel && data.spiceLevel !== criteria.spiceLevel) return false;
        if (criteria.maxCalories && data.calories > criteria.maxCalories) return false;
        if (criteria.allergenFree && criteria.allergenFree.some(allergen => data.allergens.includes(allergen))) return false;
        if (criteria.dietaryTags && !criteria.dietaryTags.every(tag => data.dietaryTags.includes(tag))) return false;
        return true;
      })
      .map(([name]) => name);
  }
}
