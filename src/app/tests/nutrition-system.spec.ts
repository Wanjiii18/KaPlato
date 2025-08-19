import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnhancedNutritionService } from '../services/enhanced-nutrition.service';
import { SpoonacularService } from '../services/spoonacular.service';

describe('NutritionSystemIntegration', () => {
  let nutritionService: EnhancedNutritionService;
  let spoonacularService: SpoonacularService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnhancedNutritionService, SpoonacularService]
    });
    
    nutritionService = TestBed.inject(EnhancedNutritionService);
    spoonacularService = TestBed.inject(SpoonacularService);
  });

  it('should create enhanced nutrition service', () => {
    expect(nutritionService).toBeTruthy();
  });

  it('should create spoonacular service', () => {
    expect(spoonacularService).toBeTruthy();
  });

  it('should have Filipino dishes database', () => {
    const filipinoDishes = nutritionService.getAllFilipinoDishes();
    expect(filipinoDishes.length).toBeGreaterThan(0);
    expect(filipinoDishes).toContain('adobo');
  });

  it('should search Filipino dishes by criteria', () => {
    const healthyDishes = nutritionService.searchFilipinoDishes({
      maxCalories: 300,
      dietaryTags: ['healthy']
    });
    expect(healthyDishes.length).toBeGreaterThan(0);
  });

  it('should check allergen compatibility', async () => {
    const nutrition = await nutritionService.getMenuItemNutrition('adobo');
    
    if (nutrition) {
      const allergenCheck = nutritionService.checkAllergenCompatibility(
        nutrition, 
        ['peanuts']
      );
      expect(allergenCheck.isSafe).toBeDefined();
      expect(allergenCheck.warnings).toBeDefined();
    }
  });

  it('should generate nutrition estimation for unknown dishes', async () => {
    const nutrition = await nutritionService.getMenuItemNutrition('unknown_dish');
    expect(nutrition).toBeTruthy();
    expect(nutrition?.nutrition.calories).toBeGreaterThan(0);
  });
});
