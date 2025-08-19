import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AllergenInfo {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  alternatives?: string[];
}

export interface NutritionData {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  calcium: number; // mg
  iron: number; // mg
  vitaminC: number; // mg
  vitaminA: number; // IU
}

export interface IngredientAnalysis {
  ingredient: string;
  allergens: AllergenInfo[];
  nutrition: NutritionData;
  category: string;
  tags: string[];
}

export interface DishAnalysis {
  totalCalories: number;
  totalNutrition: NutritionData;
  allergens: AllergenInfo[];
  healthScore: number; // 1-100
  recommendations: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NutritionAllergenService {
  private apiUrl = environment.apiUrl;
  private allergenDatabaseSubject = new BehaviorSubject<AllergenInfo[]>([]);
  
  allergenDatabase$ = this.allergenDatabaseSubject.asObservable();

  // Comprehensive allergen database
  private allergenDatabase: { [key: string]: AllergenInfo } = {
    // Common allergens
    'milk': {
      allergen: 'Dairy',
      severity: 'moderate',
      description: 'Contains lactose and milk proteins',
      alternatives: ['coconut milk', 'almond milk', 'oat milk']
    },
    'cheese': {
      allergen: 'Dairy',
      severity: 'moderate',
      description: 'Contains lactose and milk proteins',
      alternatives: ['vegan cheese', 'nutritional yeast']
    },
    'butter': {
      allergen: 'Dairy',
      severity: 'moderate',
      description: 'Contains milk fat and proteins',
      alternatives: ['coconut oil', 'vegan butter', 'olive oil']
    },
    'cream': {
      allergen: 'Dairy',
      severity: 'moderate',
      description: 'High in lactose and milk proteins',
      alternatives: ['coconut cream', 'cashew cream']
    },
    
    // Gluten sources
    'wheat': {
      allergen: 'Gluten',
      severity: 'severe',
      description: 'Contains gluten proteins',
      alternatives: ['rice flour', 'coconut flour', 'almond flour']
    },
    'flour': {
      allergen: 'Gluten',
      severity: 'severe',
      description: 'Usually contains wheat gluten',
      alternatives: ['rice flour', 'tapioca flour', 'corn starch']
    },
    'bread': {
      allergen: 'Gluten',
      severity: 'severe',
      description: 'Made with wheat flour containing gluten',
      alternatives: ['gluten-free bread', 'rice cakes']
    },
    'noodles': {
      allergen: 'Gluten',
      severity: 'severe',
      description: 'Usually made with wheat flour',
      alternatives: ['rice noodles', 'shirataki noodles']
    },
    'pasta': {
      allergen: 'Gluten',
      severity: 'severe',
      description: 'Made with wheat containing gluten',
      alternatives: ['rice pasta', 'zucchini noodles']
    },

    // Nuts and seeds
    'peanuts': {
      allergen: 'Peanuts',
      severity: 'severe',
      description: 'High risk allergen, can cause anaphylaxis',
      alternatives: ['sunflower seeds', 'pumpkin seeds']
    },
    'almonds': {
      allergen: 'Tree Nuts',
      severity: 'severe',
      description: 'Tree nut allergen',
      alternatives: ['sunflower seeds', 'coconut']
    },
    'cashews': {
      allergen: 'Tree Nuts',
      severity: 'severe',
      description: 'Tree nut allergen',
      alternatives: ['sunflower seeds', 'hemp hearts']
    },
    'walnuts': {
      allergen: 'Tree Nuts',
      severity: 'severe',
      description: 'Tree nut allergen',
      alternatives: ['pumpkin seeds', 'chia seeds']
    },

    // Seafood
    'shrimp': {
      allergen: 'Shellfish',
      severity: 'severe',
      description: 'Crustacean shellfish allergen',
      alternatives: ['mushrooms', 'tofu', 'tempeh']
    },
    'crab': {
      allergen: 'Shellfish',
      severity: 'severe',
      description: 'Crustacean shellfish allergen',
      alternatives: ['king oyster mushrooms', 'hearts of palm']
    },
    'fish': {
      allergen: 'Fish',
      severity: 'moderate',
      description: 'Contains fish proteins',
      alternatives: ['tofu', 'tempeh', 'seitan']
    },
    'salmon': {
      allergen: 'Fish',
      severity: 'moderate',
      description: 'Fish allergen',
      alternatives: ['marinated tofu', 'hearts of palm']
    },

    // Eggs
    'eggs': {
      allergen: 'Eggs',
      severity: 'moderate',
      description: 'Contains egg proteins',
      alternatives: ['flax eggs', 'aquafaba', 'tofu scramble']
    },
    'egg': {
      allergen: 'Eggs',
      severity: 'moderate',
      description: 'Contains egg proteins',
      alternatives: ['chia eggs', 'banana', 'applesauce']
    },

    // Soy
    'soy sauce': {
      allergen: 'Soy',
      severity: 'mild',
      description: 'Contains soy proteins',
      alternatives: ['coconut aminos', 'tamari (if gluten-free)']
    },
    'tofu': {
      allergen: 'Soy',
      severity: 'mild',
      description: 'Made from soybeans',
      alternatives: ['tempeh', 'seitan', 'mushrooms']
    },
    'tempeh': {
      allergen: 'Soy',
      severity: 'mild',
      description: 'Fermented soy product',
      alternatives: ['seitan', 'mushrooms', 'lentils']
    }
  };

  // Nutrition database per 100g
  private nutritionDatabase: { [key: string]: NutritionData } = {
    // Proteins
    'chicken': {
      calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0,
      sugar: 0, sodium: 74, calcium: 11, iron: 0.9, vitaminC: 0, vitaminA: 41
    },
    'pork': {
      calories: 242, protein: 27, carbohydrates: 0, fat: 14, fiber: 0,
      sugar: 0, sodium: 62, calcium: 19, iron: 0.9, vitaminC: 0, vitaminA: 2
    },
    'beef': {
      calories: 250, protein: 26, carbohydrates: 0, fat: 15, fiber: 0,
      sugar: 0, sodium: 72, calcium: 18, iron: 2.6, vitaminC: 0, vitaminA: 7
    },
    'fish': {
      calories: 206, protein: 22, carbohydrates: 0, fat: 12, fiber: 0,
      sugar: 0, sodium: 59, calcium: 16, iron: 0.4, vitaminC: 0, vitaminA: 54
    },
    'shrimp': {
      calories: 99, protein: 18, carbohydrates: 0.9, fat: 1.7, fiber: 0,
      sugar: 0, sodium: 111, calcium: 52, iron: 0.5, vitaminC: 0, vitaminA: 54
    },
    'eggs': {
      calories: 155, protein: 13, carbohydrates: 1.1, fat: 11, fiber: 0,
      sugar: 1.1, sodium: 124, calcium: 56, iron: 1.8, vitaminC: 0, vitaminA: 540
    },
    'tofu': {
      calories: 76, protein: 8, carbohydrates: 1.9, fat: 4.8, fiber: 0.3,
      sugar: 0.6, sodium: 7, calcium: 350, iron: 5.4, vitaminC: 0.1, vitaminA: 85
    },

    // Carbohydrates
    'rice': {
      calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4,
      sugar: 0.1, sodium: 1, calcium: 10, iron: 0.2, vitaminC: 0, vitaminA: 0
    },
    'noodles': {
      calories: 138, protein: 4.5, carbohydrates: 25, fat: 2.2, fiber: 1.8,
      sugar: 0.6, sodium: 3, calcium: 7, iron: 0.9, vitaminC: 0, vitaminA: 0
    },
    'bread': {
      calories: 265, protein: 9, carbohydrates: 49, fat: 3.2, fiber: 2.7,
      sugar: 5, sodium: 491, calcium: 41, iron: 3.6, vitaminC: 0, vitaminA: 0
    },
    'potato': {
      calories: 77, protein: 2, carbohydrates: 17, fat: 0.1, fiber: 2.2,
      sugar: 0.8, sodium: 6, calcium: 12, iron: 0.8, vitaminC: 19.7, vitaminA: 2
    },

    // Vegetables
    'tomato': {
      calories: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2,
      sugar: 2.6, sodium: 5, calcium: 10, iron: 0.3, vitaminC: 13.7, vitaminA: 833
    },
    'onion': {
      calories: 40, protein: 1.1, carbohydrates: 9.3, fat: 0.1, fiber: 1.7,
      sugar: 4.2, sodium: 4, calcium: 23, iron: 0.2, vitaminC: 7.4, vitaminA: 2
    },
    'garlic': {
      calories: 149, protein: 6.4, carbohydrates: 33, fat: 0.5, fiber: 2.1,
      sugar: 1, sodium: 17, calcium: 181, iron: 1.7, vitaminC: 31.2, vitaminA: 9
    },
    'ginger': {
      calories: 80, protein: 1.8, carbohydrates: 18, fat: 0.8, fiber: 2,
      sugar: 1.7, sodium: 13, calcium: 16, iron: 0.6, vitaminC: 5, vitaminA: 0
    },
    'cabbage': {
      calories: 25, protein: 1.3, carbohydrates: 5.8, fat: 0.1, fiber: 2.5,
      sugar: 3.2, sodium: 18, calcium: 40, iron: 0.5, vitaminC: 36.6, vitaminA: 98
    },
    'carrots': {
      calories: 41, protein: 0.9, carbohydrates: 9.6, fat: 0.2, fiber: 2.8,
      sugar: 4.7, sodium: 69, calcium: 33, iron: 0.3, vitaminC: 5.9, vitaminA: 16706
    },

    // Condiments and seasonings
    'soy sauce': {
      calories: 8, protein: 1.3, carbohydrates: 0.8, fat: 0, fiber: 0.1,
      sugar: 0.4, sodium: 5493, calcium: 20, iron: 0.4, vitaminC: 0, vitaminA: 4
    },
    'vinegar': {
      calories: 18, protein: 0, carbohydrates: 0.04, fat: 0, fiber: 0,
      sugar: 0.04, sodium: 2, calcium: 6, iron: 0.2, vitaminC: 0, vitaminA: 0
    },
    'oil': {
      calories: 884, protein: 0, carbohydrates: 0, fat: 100, fiber: 0,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0
    },
    'salt': {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 38758, calcium: 24, iron: 0.3, vitaminC: 0, vitaminA: 0
    }
  };

  constructor(private http: HttpClient) {
    this.loadAllergenDatabase();
  }

  private loadAllergenDatabase(): void {
    const allergens = Object.values(this.allergenDatabase);
    this.allergenDatabaseSubject.next(allergens);
  }

  /**
   * Analyze ingredients for allergens and nutrition
   */
  analyzeIngredients(ingredients: string[]): IngredientAnalysis[] {
    return ingredients.map(ingredient => this.analyzeIngredient(ingredient.toLowerCase()));
  }

  /**
   * Analyze a single ingredient
   */
  analyzeIngredient(ingredient: string): IngredientAnalysis {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Find allergens
    const allergens: AllergenInfo[] = [];
    for (const [key, allergenInfo] of Object.entries(this.allergenDatabase)) {
      if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
        allergens.push(allergenInfo);
      }
    }

    // Find nutrition data
    let nutrition = this.nutritionDatabase[normalizedIngredient] || this.getDefaultNutrition();
    
    // Try partial matches for nutrition
    if (!this.nutritionDatabase[normalizedIngredient]) {
      for (const [key, nutritionData] of Object.entries(this.nutritionDatabase)) {
        if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
          nutrition = nutritionData;
          break;
        }
      }
    }

    // Categorize ingredient
    const category = this.categorizeIngredient(normalizedIngredient);
    
    // Generate tags
    const tags = this.generateTags(normalizedIngredient, allergens, category);

    return {
      ingredient: ingredient,
      allergens,
      nutrition,
      category,
      tags
    };
  }

  /**
   * Analyze complete dish for nutrition and allergens
   */
  analyzeDish(ingredients: string[], portions: number = 1): DishAnalysis {
    const ingredientAnalyses = this.analyzeIngredients(ingredients);
    
    // Aggregate nutrition data
    const totalNutrition: NutritionData = {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0
    };

    const allAllergens: AllergenInfo[] = [];
    
    ingredientAnalyses.forEach(analysis => {
      // Add nutrition (assuming 100g per ingredient as base)
      const portionFactor = portions * 0.1; // Adjust for typical serving size
      Object.keys(totalNutrition).forEach(key => {
        (totalNutrition as any)[key] += (analysis.nutrition as any)[key] * portionFactor;
      });

      // Collect unique allergens
      analysis.allergens.forEach(allergen => {
        if (!allAllergens.find(a => a.allergen === allergen.allergen)) {
          allAllergens.push(allergen);
        }
      });
    });

    // Calculate health score
    const healthScore = this.calculateHealthScore(totalNutrition, allAllergens, ingredientAnalyses);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(totalNutrition, ingredientAnalyses);
    
    // Generate warnings
    const warnings = this.generateWarnings(allAllergens, totalNutrition);

    return {
      totalCalories: Math.round(totalNutrition.calories),
      totalNutrition,
      allergens: allAllergens,
      healthScore,
      recommendations,
      warnings
    };
  }

  /**
   * Get allergen alternatives for a dish
   */
  getAllergenAlternatives(ingredients: string[]): { [allergen: string]: string[] } {
    const alternatives: { [allergen: string]: string[] } = {};
    
    ingredients.forEach(ingredient => {
      const analysis = this.analyzeIngredient(ingredient);
      analysis.allergens.forEach(allergen => {
        if (allergen.alternatives) {
          if (!alternatives[allergen.allergen]) {
            alternatives[allergen.allergen] = [];
          }
          alternatives[allergen.allergen].push(...allergen.alternatives);
        }
      });
    });

    // Remove duplicates
    Object.keys(alternatives).forEach(key => {
      alternatives[key] = [...new Set(alternatives[key])];
    });

    return alternatives;
  }

  /**
   * Calculate nutrition per serving
   */
  calculateNutritionPerServing(dishAnalysis: DishAnalysis, servings: number): NutritionData {
    const perServing: NutritionData = { ...dishAnalysis.totalNutrition };
    
    Object.keys(perServing).forEach(key => {
      (perServing as any)[key] = Math.round(((perServing as any)[key] / servings) * 100) / 100;
    });

    return perServing;
  }

  private getDefaultNutrition(): NutritionData {
    return {
      calories: 20, protein: 1, carbohydrates: 4, fat: 0.1, fiber: 1,
      sugar: 2, sodium: 5, calcium: 10, iron: 0.2, vitaminC: 2, vitaminA: 10
    };
  }

  private categorizeIngredient(ingredient: string): string {
    if (['chicken', 'pork', 'beef', 'fish', 'shrimp', 'eggs', 'tofu'].some(p => ingredient.includes(p))) {
      return 'protein';
    }
    if (['rice', 'noodles', 'bread', 'potato', 'pasta'].some(c => ingredient.includes(c))) {
      return 'carbohydrate';
    }
    if (['tomato', 'onion', 'garlic', 'cabbage', 'carrots', 'kangkong'].some(v => ingredient.includes(v))) {
      return 'vegetable';
    }
    if (['oil', 'butter', 'cream'].some(f => ingredient.includes(f))) {
      return 'fat';
    }
    if (['soy sauce', 'vinegar', 'salt', 'pepper'].some(s => ingredient.includes(s))) {
      return 'seasoning';
    }
    return 'other';
  }

  private generateTags(ingredient: string, allergens: AllergenInfo[], category: string): string[] {
    const tags: string[] = [category];
    
    if (allergens.length === 0) tags.push('allergen-free');
    if (allergens.some(a => a.severity === 'severe')) tags.push('high-allergen-risk');
    
    // Dietary tags
    if (!ingredient.includes('meat') && !ingredient.includes('chicken') && !ingredient.includes('pork') && !ingredient.includes('beef')) {
      tags.push('vegetarian');
    }
    if (!allergens.some(a => a.allergen === 'Dairy' || a.allergen === 'Eggs')) {
      tags.push('vegan-friendly');
    }
    if (!allergens.some(a => a.allergen === 'Gluten')) {
      tags.push('gluten-free');
    }

    return tags;
  }

  private calculateHealthScore(nutrition: NutritionData, allergens: AllergenInfo[], ingredients: IngredientAnalysis[]): number {
    let score = 50; // Base score

    // Positive factors
    if (nutrition.protein > 15) score += 10; // Good protein content
    if (nutrition.fiber > 5) score += 10; // Good fiber content
    if (nutrition.vitaminC > 10) score += 5; // Good vitamin C
    if (nutrition.calcium > 100) score += 5; // Good calcium
    if (nutrition.iron > 2) score += 5; // Good iron

    // Negative factors
    if (nutrition.sodium > 2000) score -= 15; // High sodium
    if (nutrition.sugar > 20) score -= 10; // High sugar
    if (nutrition.fat > 30) score -= 5; // High fat
    if (allergens.length > 2) score -= 10; // Multiple allergens

    // Ingredient diversity bonus
    const categories = new Set(ingredients.map(i => i.category));
    score += categories.size * 2;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(nutrition: NutritionData, ingredients: IngredientAnalysis[]): string[] {
    const recommendations: string[] = [];

    if (nutrition.protein < 15) {
      recommendations.push('Consider adding more protein sources like chicken, tofu, or eggs');
    }
    if (nutrition.fiber < 3) {
      recommendations.push('Add more vegetables or whole grains for fiber');
    }
    if (nutrition.sodium > 2000) {
      recommendations.push('Reduce salt or soy sauce to lower sodium content');
    }
    if (nutrition.vitaminC < 5) {
      recommendations.push('Add vitamin C-rich vegetables like tomatoes or bell peppers');
    }

    const hasVegetables = ingredients.some(i => i.category === 'vegetable');
    if (!hasVegetables) {
      recommendations.push('Add vegetables for better nutritional balance');
    }

    return recommendations;
  }

  private generateWarnings(allergens: AllergenInfo[], nutrition: NutritionData): string[] {
    const warnings: string[] = [];

    allergens.forEach(allergen => {
      if (allergen.severity === 'severe') {
        warnings.push(`⚠️ Contains ${allergen.allergen} - severe allergen risk`);
      }
    });

    if (nutrition.sodium > 2300) {
      warnings.push('⚠️ High sodium content - may not be suitable for people with high blood pressure');
    }
    if (nutrition.calories > 800) {
      warnings.push('⚠️ High calorie content - consider portion size');
    }

    return warnings;
  }

  /**
   * Get comprehensive allergen list
   */
  getAllergenList(): string[] {
    return [...new Set(Object.values(this.allergenDatabase).map(a => a.allergen))];
  }

  /**
   * Get nutrition label format
   */
  getNutritionLabel(nutrition: NutritionData): { [key: string]: string } {
    return {
      'Calories': `${Math.round(nutrition.calories)}`,
      'Protein': `${nutrition.protein.toFixed(1)}g`,
      'Carbohydrates': `${nutrition.carbohydrates.toFixed(1)}g`,
      'Fat': `${nutrition.fat.toFixed(1)}g`,
      'Fiber': `${nutrition.fiber.toFixed(1)}g`,
      'Sugar': `${nutrition.sugar.toFixed(1)}g`,
      'Sodium': `${Math.round(nutrition.sodium)}mg`,
      'Calcium': `${Math.round(nutrition.calcium)}mg`,
      'Iron': `${nutrition.iron.toFixed(1)}mg`,
      'Vitamin C': `${nutrition.vitaminC.toFixed(1)}mg`,
      'Vitamin A': `${Math.round(nutrition.vitaminA)}IU`
    };
  }
}
