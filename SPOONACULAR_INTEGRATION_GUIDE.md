# KaPlato Spoonacular Integration Guide

## Overview
This integration adds nutrition information and enhanced allergen detection using the Spoonacular Food API. The system now provides:

1. **Detailed Nutrition Information** - Calories, macros, vitamins, minerals
2. **Enhanced Allergen Detection** - Filipino ingredient mapping with safety analysis
3. **Real-time Recipe Analysis** - Live nutrition data for menu items

## Features Implemented

### 1. Enhanced Meal Details Page
- **Nutrition Analysis**: Real-time nutrition data from Spoonacular API
- **Allergen Safety**: Comprehensive allergen warnings with Filipino context
- **Interactive Display**: Collapsible detailed nutrition breakdown
- **Safety Recommendations**: Personalized allergen advice

### 2. Back Button Fix
- Fixed allergen profile back button to properly navigate to `/home`
- Improved navigation flow for better user experience

### 3. Spoonacular Service Enhancements
- Added Filipino ingredient recognition:
  - **Soy**: toyo, tokwa, taho (soy sauce, tofu, soy pudding)
  - **Fish**: isda, bangus, patis (fish, milkfish, fish sauce)
  - **Shellfish**: hipon, alimango, bagoong (shrimp, crab, shrimp paste)
  - **Dairy**: gatas, keso, mantikilya (milk, cheese, butter)
  - **Eggs**: itlog, balut (eggs, duck embryo)

## API Usage Examples

### 1. Search Filipino Recipes
```typescript
// Search for Filipino recipes with allergen filtering
this.spoonacularService.searchFilipinoRecipesWithAllergens('adobo', ['dairy', 'soy'])
  .subscribe(recipes => {
    console.log('Safe Filipino recipes:', recipes);
  });
```

### 2. Get Meal Analysis
```typescript
// Get comprehensive nutrition and allergen analysis
this.spoonacularService.getMealAnalysisWithAllergens(recipeId, userAllergens)
  .subscribe(analysis => {
    console.log('Calories:', analysis.nutrition.calories);
    console.log('Allergen warnings:', analysis.allergenWarnings);
    console.log('Safety level:', analysis.safetyLevel);
  });
```

### 3. Recipe Search with Filters
```typescript
// Search recipes with specific dietary requirements
this.spoonacularService.searchRecipes('chicken adobo', 'asian', 'gluten free', 'dairy,soy', 10)
  .subscribe(results => {
    console.log('Filtered recipes:', results);
  });
```

## UI Components

### Nutrition Display
```html
<!-- Enhanced nutrition card with detailed breakdown -->
<div class="nutrition-card">
  <div class="nutrition-grid">
    <div class="nutrition-item highlight">
      <ion-icon name="flash" color="warning"></ion-icon>
      <span class="label">Calories</span>
      <span class="value">{{ nutritionData.calories }}</span>
    </div>
    <!-- More nutrition items... -->
  </div>
  
  <!-- Collapsible detailed nutrition -->
  <div *ngIf="showNutritionDetails" class="detailed-nutrition">
    <div class="nutrition-detail" *ngFor="let nutrient of nutritionData.nutrients">
      <span class="nutrient-name">{{ nutrient.name }}</span>
      <span class="nutrient-value">{{ nutrient.amount }}{{ nutrient.unit }}</span>
      <span class="nutrient-percent">{{ nutrient.percentOfDailyNeeds }}% DV</span>
    </div>
  </div>
</div>
```

### Allergen Safety Analysis
```html
<!-- Safety analysis with warnings and recommendations -->
<div class="allergen-card">
  <div class="card-header">
    <h3>
      <ion-icon [name]="getSafetyLevelIcon()" [color]="getSafetyLevelColor()"></ion-icon>
      Allergen Safety Analysis
    </h3>
    <ion-chip [color]="getSafetyLevelColor()">
      <ion-label>{{ allergenAnalysis.safetyLevel.toUpperCase() }}</ion-label>
    </ion-chip>
  </div>
  
  <!-- Warning chips -->
  <div class="warnings-list">
    <ion-chip *ngFor="let warning of allergenAnalysis.warnings" color="danger">
      <ion-icon name="warning"></ion-icon>
      <ion-label>{{ warning }}</ion-label>
    </ion-chip>
  </div>
  
  <!-- Safety recommendations -->
  <ul class="recommendations-list">
    <li *ngFor="let recommendation of allergenAnalysis.recommendations">
      {{ recommendation }}
    </li>
  </ul>
</div>
```

## Configuration

### Environment Setup
```typescript
// src/environments/environment.ts
export const environment = {
  spoonacular: {
    apiKey: 'your-spoonacular-api-key', // Get from spoonacular.com
    baseUrl: 'https://api.spoonacular.com'
  }
};
```

### API Key Setup
1. Visit [Spoonacular.com](https://spoonacular.com/food-api)
2. Sign up for a free account (150 requests/day)
3. Get your API key from the dashboard
4. Update `environment.ts` with your key

## Testing Examples

### Sample Meal Data
```typescript
const testMeal = {
  id: '1',
  name: 'Chicken Adobo',
  ingredients: ['chicken', 'soy sauce', 'vinegar', 'garlic', 'bay leaves'],
  description: 'Traditional Filipino chicken adobo'
};

// Expected results:
// - Calories: ~300-400 per serving
// - Allergens: soy (from soy sauce/toyo)
// - Safety level: 'danger' for users with soy allergy
```

### Filipino Ingredient Recognition
```typescript
const ingredients = ['tokwa', 'bagoong', 'patis', 'gatas', 'itlog'];
// System will detect:
// - tokwa → soy allergen
// - bagoong → shellfish allergen  
// - patis → fish allergen
// - gatas → dairy allergen
// - itlog → egg allergen
```

## API Endpoints Used

### Spoonacular API Calls
1. **Recipe Search**: `GET /recipes/complexSearch`
   - Parameters: query, cuisine, diet, intolerances, number
   - Returns: Recipe list with basic info

2. **Recipe Details**: `GET /recipes/{id}/information`
   - Parameters: includeNutrition=true
   - Returns: Complete recipe with nutrition data

3. **Nutrition Widget**: `GET /recipes/{id}/nutritionWidget.json`
   - Returns: Detailed nutrition breakdown

## Performance Considerations

### API Rate Limits
- **Free Tier**: 150 requests/day
- **Paid Plans**: Up to 100,000+ requests/month
- **Caching**: Results cached locally to reduce API calls

### Optimization Strategies
1. **Local Caching**: Store nutrition data in localStorage
2. **Batch Requests**: Group multiple recipe requests
3. **Fallback Data**: Use local allergen detection when API unavailable
4. **Progressive Loading**: Load nutrition data after main content

## Error Handling

### API Failures
```typescript
// Graceful fallback to local allergen detection
try {
  const spoonacularData = await this.spoonacularService.getMealAnalysis(recipeId);
  this.nutritionData = spoonacularData.nutrition;
} catch (error) {
  console.log('Spoonacular API unavailable, using local detection');
  this.allergenAnalysis = this.localAllergenService.analyze(meal);
}
```

### Network Issues
- Automatic retry with exponential backoff
- Local allergen detection as fallback
- User-friendly error messages
- Offline mode support

## Future Enhancements

1. **Recipe Recommendations**: Suggest alternatives for unsafe meals
2. **Nutrition Goals**: Track daily nutrition targets  
3. **Meal Planning**: Weekly meal planning with nutrition balance
4. **Shopping Lists**: Generate ingredient lists with nutrition info
5. **Restaurant Integration**: Allow restaurants to provide nutrition data

## Support

For API issues:
- Check Spoonacular API status
- Verify API key validity
- Review rate limit usage
- Check network connectivity

For integration questions:
- Review service documentation
- Check error logs
- Test with sample data
- Verify environment configuration
