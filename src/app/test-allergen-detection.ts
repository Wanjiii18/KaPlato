// Test file to demonstrate allergen detection functionality
// This file shows how the allergen detection system works with Filipino ingredients

import { AllergenDetectionService } from './services/allergen-detection.service';

// Sample test data
const testUserAllergens = ['peanuts', 'milk', 'eggs'];

const testMeals = [
  {
    id: 1,
    name: 'Chicken Adobo',
    ingredients: ['chicken', 'soy sauce', 'vinegar', 'garlic', 'bay leaves'],
    description: 'Traditional Filipino chicken adobo'
  },
  {
    id: 2,
    name: 'Kare-Kare',
    ingredients: ['oxtail', 'vegetables', 'peanut sauce', 'bagoong'],
    description: 'Filipino stew with peanut sauce'
  },
  {
    id: 3,
    name: 'Leche Flan',
    ingredients: ['eggs', 'milk', 'sugar', 'vanilla'],
    description: 'Filipino custard dessert'
  },
  {
    id: 4,
    name: 'Tokwa at Baboy',
    ingredients: ['tofu', 'pork', 'soy sauce', 'onions'],
    description: 'Tofu and pork dish'
  }
];

// Example usage:
export function testAllergenDetection() {
  console.log('=== KaPlato Allergen Detection Test ===');
  console.log('User Allergens:', testUserAllergens);
  console.log('');

  testMeals.forEach(meal => {
    console.log(`Testing: ${meal.name}`);
    console.log(`Ingredients: ${meal.ingredients.join(', ')}`);
    
    // This would normally use the AllergenDetectionService
    // const analysis = allergenService.analyzeMealSafety(meal, testUserAllergens);
    
    // Manual detection for demonstration
    const foundAllergens: string[] = [];
    meal.ingredients.forEach(ingredient => {
      if (ingredient.toLowerCase().includes('peanut') || ingredient.toLowerCase().includes('mani')) {
        foundAllergens.push('peanuts');
      }
      if (ingredient.toLowerCase().includes('milk') || ingredient.toLowerCase().includes('gatas')) {
        foundAllergens.push('milk');
      }
      if (ingredient.toLowerCase().includes('egg') || ingredient.toLowerCase().includes('itlog')) {
        foundAllergens.push('eggs');
      }
    });

    if (foundAllergens.length > 0) {
      console.log(`⚠️ ALLERGEN WARNING: Contains ${foundAllergens.join(', ')}`);
      console.log('🚫 NOT SAFE for this user');
    } else {
      console.log('✅ SAFE for this user');
    }
    console.log('---');
  });
}

// Expected Results:
// - Chicken Adobo: ✅ SAFE (no allergens detected)
// - Kare-Kare: ⚠️ WARNING (contains peanuts in "peanut sauce")
// - Leche Flan: ⚠️ WARNING (contains eggs and milk)
// - Tokwa at Baboy: ✅ SAFE (no allergens detected)
