import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService, User } from './auth.service';
import { UserService, UserProfile } from './user.service';
import { ProfileService } from './profile.service';

export interface AllergenWarning {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  foundIn: string[];
  message: string;
}

export interface IngredientAnalysis {
  ingredient: string;
  potentialAllergens: string[];
  category: string;
}

export interface MealSafetyAnalysis {
  isSafe: boolean;
  warnings: AllergenWarning[];
  safeAlternatives?: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class AllergenDetectionService {
  private userAllergens: any[] = [];
  private allergenWarnings$ = new BehaviorSubject<AllergenWarning[]>([]);
  
  // Comprehensive allergen-ingredient mapping
  private allergenIngredientMap: { [key: string]: string[] } = {
    'Peanuts': [
      'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'arachis oil',
      'mandelonas', 'beer nuts', 'mixed nuts', 'nut meat'
    ],
    'Tree Nuts': [
      'almond', 'almonds', 'brazil nut', 'cashew', 'cashews', 'chestnut', 'hazelnut', 
      'macadamia', 'pecan', 'pine nut', 'pistachio', 'walnut', 'coconut', 'nut oil',
      'marzipan', 'nougat', 'praline', 'gianduja', 'amaretto'
    ],
    'Dairy': [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'ice cream', 'lactose',
      'casein', 'whey', 'ghee', 'buttermilk', 'sour cream', 'cottage cheese',
      'mozzarella', 'cheddar', 'parmesan', 'condensed milk', 'evaporated milk'
    ],
    'Eggs': [
      'egg', 'eggs', 'egg white', 'egg yolk', 'albumin', 'mayonnaise', 'aioli',
      'meringue', 'custard', 'eggnog', 'lecithin', 'lysozyme', 'ovalbumin'
    ],
    'Fish': [
      'fish', 'salmon', 'tuna', 'cod', 'bass', 'flounder', 'halibut', 'sardine',
      'anchovy', 'mackerel', 'trout', 'fish sauce', 'fish oil', 'worcestershire sauce',
      'caesar dressing', 'imitation crab', 'surimi'
    ],
    'Shellfish': [
      'shrimp', 'crab', 'lobster', 'crawfish', 'prawns', 'scallops', 'clams',
      'mussels', 'oysters', 'crayfish', 'langostino', 'barnacle', 'krill'
    ],
    'Soy': [
      'soy', 'soya', 'soybean', 'tofu', 'tempeh', 'miso', 'soy sauce', 'tamari',
      'edamame', 'soy milk', 'soy flour', 'soy protein', 'lecithin', 'hydrolyzed soy protein'
    ],
    'Wheat': [
      'wheat', 'flour', 'bread', 'pasta', 'noodles', 'gluten', 'bulgur', 'couscous',
      'semolina', 'spelt', 'kamut', 'farro', 'wheat germ', 'wheat bran', 'seitan'
    ],
    'Sesame': [
      'sesame', 'sesame seeds', 'sesame oil', 'tahini', 'hummus', 'halva',
      'benne seeds', 'sim sim', 'goma'
    ],
    'Mustard': [
      'mustard', 'mustard seed', 'mustard powder', 'dijon', 'horseradish',
      'wasabi', 'mustard greens'
    ]
  };

  // Filipino-specific allergen ingredients
  private filipinoAllergenMap: { [key: string]: string[] } = {
    'Fish': [
      'bagoong', 'patis', 'fish sauce', 'dilis', 'tuyo', 'daing', 'tinapa',
      'alamang', 'isda', 'bangus', 'tilapia', 'galunggong'
    ],
    'Shellfish': [
      'hipon', 'alimango', 'talaba', 'pusit', 'sugpo', 'suahe', 'halaan'
    ],
    'Soy': [
      'tokwa', 'taho', 'soy sauce', 'toyo', 'miso soup'
    ],
    'Eggs': [
      'itlog', 'kwek-kwek', 'balut', 'penoy'
    ],
    'Dairy': [
      'gatas', 'kesong puti', 'ice cream', 'leche flan'
    ],
    'Peanuts': [
      'mani', 'kare-kare', 'biko na may mani'
    ],
    'Wheat': [
      'harina', 'tinapay', 'pandesal', 'pasta', 'lumpia wrapper'
    ]
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private profileService: ProfileService
  ) {
    this.loadUserAllergens();
  }

  private async loadUserAllergens() {
    // Load user's allergens from user profile
    this.userService.currentUserProfile$.subscribe(userProfile => {
      if (userProfile && userProfile.allergens) {
        this.userAllergens = userProfile.allergens;
      } else if (userProfile && userProfile.allergies) {
        // Fallback to allergies array if available
        this.userAllergens = userProfile.allergies.map(allergy => ({
          name: allergy,
          severity: 'moderate' // default severity
        }));
      }
    });
  }

  /**
   * Analyze a meal's ingredients for potential allergens
   */
  analyzeMealSafety(ingredients: string[], mealName?: string): MealSafetyAnalysis {
    const warnings: AllergenWarning[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    for (const userAllergen of this.userAllergens) {
      const foundIngredients = this.findAllergenInIngredients(userAllergen.name, ingredients);
      
      if (foundIngredients.length > 0) {
        const warning: AllergenWarning = {
          allergen: userAllergen.name,
          severity: userAllergen.severity || 'moderate',
          foundIn: foundIngredients,
          message: this.generateWarningMessage(userAllergen.name, userAllergen.severity, foundIngredients, mealName)
        };
        warnings.push(warning);

        // Update risk level based on severity
        if (userAllergen.severity === 'severe') {
          riskLevel = 'high';
        } else if (userAllergen.severity === 'moderate' && riskLevel !== 'high') {
          riskLevel = 'medium';
        }
      }
    }

    return {
      isSafe: warnings.length === 0,
      warnings,
      riskLevel,
      safeAlternatives: this.getSafeAlternatives(warnings)
    };
  }

  /**
   * Find allergen in ingredient list using fuzzy matching
   */
  private findAllergenInIngredients(allergen: string, ingredients: string[]): string[] {
    const foundIngredients: string[] = [];
    const allergenKeywords = [
      ...(this.allergenIngredientMap[allergen] || []),
      ...(this.filipinoAllergenMap[allergen] || [])
    ];

    for (const ingredient of ingredients) {
      const ingredientLower = ingredient.toLowerCase();
      
      for (const keyword of allergenKeywords) {
        if (ingredientLower.includes(keyword.toLowerCase())) {
          foundIngredients.push(ingredient);
          break;
        }
      }
    }

    return foundIngredients;
  }

  /**
   * Generate contextual warning message
   */
  private generateWarningMessage(allergen: string, severity: string, foundIn: string[], mealName?: string): string {
    const mealText = mealName ? ` in "${mealName}"` : '';
    const ingredientList = foundIn.join(', ');
    
    switch (severity) {
      case 'severe':
        return `⚠️ DANGER: ${allergen} detected${mealText}! Found in: ${ingredientList}. This could cause a severe allergic reaction.`;
      case 'moderate':
        return `⚠️ WARNING: ${allergen} detected${mealText}. Found in: ${ingredientList}. Please avoid if you have allergies.`;
      case 'mild':
        return `ℹ️ NOTICE: ${allergen} detected${mealText}. Found in: ${ingredientList}. Monitor for mild reactions.`;
      default:
        return `⚠️ ${allergen} detected${mealText}. Found in: ${ingredientList}.`;
    }
  }

  /**
   * Get safe alternatives based on detected allergens
   */
  private getSafeAlternatives(warnings: AllergenWarning[]): string[] {
    const alternatives: string[] = [];
    const allergens = warnings.map(w => w.allergen);

    if (allergens.includes('Dairy')) {
      alternatives.push('Try plant-based alternatives like coconut milk or oat milk');
    }
    if (allergens.includes('Eggs')) {
      alternatives.push('Look for egg-free versions or ask for modifications');
    }
    if (allergens.includes('Fish') || allergens.includes('Shellfish')) {
      alternatives.push('Consider meat-based or vegetarian options');
    }
    if (allergens.includes('Peanuts') || allergens.includes('Tree Nuts')) {
      alternatives.push('Ask for nut-free preparation and separate cooking surfaces');
    }
    if (allergens.includes('Soy')) {
      alternatives.push('Request dishes without soy sauce or tofu');
    }
    if (allergens.includes('Wheat')) {
      alternatives.push('Look for rice-based dishes or gluten-free options');
    }

    return alternatives;
  }

  /**
   * Analyze ingredients for potential allergens (for ingredient scanning)
   */
  analyzeIngredients(ingredients: string[]): IngredientAnalysis[] {
    return ingredients.map(ingredient => {
      const potentialAllergens: string[] = [];
      
      for (const [allergen, keywords] of Object.entries(this.allergenIngredientMap)) {
        for (const keyword of keywords) {
          if (ingredient.toLowerCase().includes(keyword.toLowerCase())) {
            potentialAllergens.push(allergen);
            break;
          }
        }
      }

      // Check Filipino-specific allergens
      for (const [allergen, keywords] of Object.entries(this.filipinoAllergenMap)) {
        for (const keyword of keywords) {
          if (ingredient.toLowerCase().includes(keyword.toLowerCase())) {
            if (!potentialAllergens.includes(allergen)) {
              potentialAllergens.push(allergen);
            }
            break;
          }
        }
      }

      return {
        ingredient,
        potentialAllergens,
        category: this.categorizeIngredient(ingredient)
      };
    });
  }

  /**
   * Categorize ingredient for better analysis
   */
  private categorizeIngredient(ingredient: string): string {
    const ingredientLower = ingredient.toLowerCase();
    
    if (['pork', 'beef', 'chicken', 'fish', 'shrimp', 'crab'].some(meat => ingredientLower.includes(meat))) {
      return 'Protein';
    }
    if (['rice', 'bread', 'pasta', 'noodles'].some(grain => ingredientLower.includes(grain))) {
      return 'Grains';
    }
    if (['tomato', 'onion', 'garlic', 'kangkong', 'cabbage'].some(veg => ingredientLower.includes(veg))) {
      return 'Vegetables';
    }
    if (['coconut', 'oil', 'butter', 'cream'].some(fat => ingredientLower.includes(fat))) {
      return 'Fats';
    }
    if (['salt', 'pepper', 'soy sauce', 'vinegar'].some(spice => ingredientLower.includes(spice))) {
      return 'Seasonings';
    }
    
    return 'Other';
  }

  /**
   * Get allergen warnings observable
   */
  getAllergenWarnings(): Observable<AllergenWarning[]> {
    return this.allergenWarnings$.asObservable();
  }

  /**
   * Check if user has specific allergen
   */
  hasAllergen(allergenName: string): boolean {
    return this.userAllergens.some(allergen => allergen.name === allergenName);
  }

  /**
   * Get user's allergen severity level
   */
  getAllergenSeverity(allergenName: string): string | null {
    const allergen = this.userAllergens.find(a => a.name === allergenName);
    return allergen?.severity || null;
  }

  /**
   * Batch analyze multiple meals
   */
  batchAnalyzeMeals(meals: Array<{ name: string; ingredients: string[] }>): Array<{ meal: string; analysis: MealSafetyAnalysis }> {
    return meals.map(meal => ({
      meal: meal.name,
      analysis: this.analyzeMealSafety(meal.ingredients, meal.name)
    }));
  }

  /**
   * Get safe meal recommendations based on user allergens
   */
  getSafeMealRecommendations(allMeals: Array<{ name: string; ingredients: string[] }>): Array<{ name: string; ingredients: string[] }> {
    return allMeals.filter(meal => {
      const analysis = this.analyzeMealSafety(meal.ingredients, meal.name);
      return analysis.isSafe;
    });
  }

  /**
   * Update user allergens (when user modifies their profile)
   */
  updateUserAllergens(allergens: any[]) {
    this.userAllergens = allergens;
  }

  /**
   * Check a menu item against user's allergen profile
   * Returns detailed warning information for display in the UI
   */
  checkMenuItemForAllergens(menuItem: any): {
    hasAllergens: boolean;
    warnings: AllergenWarning[];
    safetyLevel: 'safe' | 'caution' | 'danger';
    conflictingIngredients: string[];
  } {
    if (!this.userAllergens || this.userAllergens.length === 0) {
      return {
        hasAllergens: false,
        warnings: [],
        safetyLevel: 'safe',
        conflictingIngredients: []
      };
    }

    const warnings: AllergenWarning[] = [];
    const conflictingIngredients: string[] = [];
    let highestSeverity: 'mild' | 'moderate' | 'severe' = 'mild';

    // Check menu item's direct allergens array
    if (menuItem.allergens && menuItem.allergens.length > 0) {
      for (const allergen of menuItem.allergens) {
        const userAllergen = this.userAllergens.find(ua => 
          ua.name?.toLowerCase().includes(allergen.toLowerCase()) ||
          allergen.toLowerCase().includes(ua.name?.toLowerCase())
        );

        if (userAllergen) {
          warnings.push({
            allergen: allergen,
            severity: userAllergen.severity || 'moderate',
            foundIn: [allergen],
            message: `Contains ${allergen} - listed as allergen`
          });

          if (userAllergen.severity === 'severe') highestSeverity = 'severe';
          else if (userAllergen.severity === 'moderate' && highestSeverity !== 'severe') highestSeverity = 'moderate';
        }
      }
    }

    // Check menu item's ingredients for potential allergens
    if (menuItem.ingredients && menuItem.ingredients.length > 0) {
      for (const ingredient of menuItem.ingredients) {
        const ingredientLower = ingredient.toLowerCase();
        
        // Check each user allergen against ingredient mapping
        for (const userAllergen of this.userAllergens) {
          const allergenName = userAllergen.name;
          const mappedIngredients = this.allergenIngredientMap[allergenName] || [];
          
          // Check if ingredient contains any mapped allergen terms
          const matchingTerms = mappedIngredients.filter(term => 
            ingredientLower.includes(term.toLowerCase()) || 
            term.toLowerCase().includes(ingredientLower)
          );

          if (matchingTerms.length > 0) {
            conflictingIngredients.push(ingredient);
            
            const existingWarning = warnings.find(w => w.allergen === allergenName);
            if (existingWarning) {
              existingWarning.foundIn.push(ingredient);
            } else {
              warnings.push({
                allergen: allergenName,
                severity: userAllergen.severity || 'moderate',
                foundIn: [ingredient],
                message: `May contain ${allergenName.toLowerCase()} - found in ${ingredient}`
              });
            }

            if (userAllergen.severity === 'severe') highestSeverity = 'severe';
            else if (userAllergen.severity === 'moderate' && highestSeverity !== 'severe') highestSeverity = 'moderate';
          }
        }
      }
    }

    // Determine safety level
    let safetyLevel: 'safe' | 'caution' | 'danger' = 'safe';
    if (warnings.length > 0) {
      if (highestSeverity === 'severe') safetyLevel = 'danger';
      else if (highestSeverity === 'moderate') safetyLevel = 'caution';
      else safetyLevel = 'caution';
    }

    return {
      hasAllergens: warnings.length > 0,
      warnings,
      safetyLevel,
      conflictingIngredients: [...new Set(conflictingIngredients)] // Remove duplicates
    };
  }
}
