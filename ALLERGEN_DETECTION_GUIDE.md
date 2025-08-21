# KaPlato Allergen Detection System

## Overview
The KaPlato allergen detection system helps customers identify potential allergens in Filipino meals and ingredients. This system is designed specifically for the Filipino context, including local ingredient names and cooking methods.

## Features

### 1. Customer Allergen Profile
- **Location**: `/allergen-profile`
- **Purpose**: Allows customers to register their allergies and dietary restrictions
- **Features**:
  - Select from common allergens (milk, eggs, peanuts, shellfish, etc.)
  - Add custom allergens
  - Test meal detection with sample meals
  - Save preferences to user profile

### 2. Meal Safety Analysis
- **Component**: `MealAllergenCardComponent`
- **Purpose**: Analyzes meals for potential allergens and displays warnings
- **Features**:
  - Real-time ingredient analysis
  - Safety level indicators (Safe, Caution, Danger)
  - Detailed allergen warnings
  - Filipino ingredient recognition

### 3. Allergen Detection Service
- **Service**: `AllergenDetectionService`
- **Purpose**: Core service for allergen detection and meal analysis
- **Features**:
  - Comprehensive allergen-ingredient mapping
  - Filipino ingredient name recognition
  - Fuzzy matching for ingredient variations
  - Safety score calculation

## Filipino Ingredient Support

The system recognizes both English and Filipino names for common ingredients:

### Allergen Mapping Examples:
- **Milk/Dairy**: milk, gatas, cheese, keso, butter, mantikilya
- **Eggs**: eggs, itlog, egg white, egg yolk
- **Peanuts**: peanuts, mani, peanut butter, peanut oil
- **Shellfish**: shrimp, hipon, crab, alimango, lobster
- **Fish**: fish, isda, tuna, bangus, tilapia
- **Soy**: soy sauce, toyo, soybean, tokwa (tofu)

### Common Filipino Ingredients:
- **Bagoong** (shrimp paste) - flagged for shellfish allergy
- **Patis** (fish sauce) - flagged for fish allergy
- **Tokwa** (tofu) - flagged for soy allergy
- **Mani** (peanuts) - flagged for peanut allergy

## Implementation

### 1. Service Integration
```typescript
// Inject the allergen detection service
constructor(private allergenService: AllergenDetectionService) {}

// Analyze a meal
const analysis = await this.allergenService.analyzeMealSafety(meal, userAllergens);
```

### 2. Component Usage
```html
<!-- Add to any meal display -->
<app-meal-allergen-card 
  [meal]="meal" 
  [userAllergens]="userAllergens">
</app-meal-allergen-card>
```

### 3. User Profile Integration
```typescript
// Save allergens to profile
await this.allergenService.saveUserAllergens(userId, allergens);

// Get user allergens
const allergens = await this.allergenService.getUserAllergens(userId);
```

## Safety Levels

### 🟢 Safe (Level 0)
- No known allergens detected
- Safe for user consumption
- Green indicator

### 🟡 Caution (Level 1)
- Minor allergen risk
- May contain traces
- Yellow indicator with warnings

### 🔴 Danger (Level 2)
- Contains user's allergens
- Not recommended
- Red indicator with detailed warnings

## Navigation

### Home Page Integration
- Allergen profile card in the main features section
- Quick access to allergen settings
- Visual safety indicators on meal cards

### Access Points
1. **Home Page**: Allergen profile card
2. **Meal Details**: Allergen warnings and analysis
3. **Profile Page**: Link to allergen settings
4. **Restaurant Menus**: Safety indicators per meal

## Technical Details

### Dependencies
- `@ionic/angular` - UI components
- `UserService` - User management
- `ProfileService` - Profile data management
- `AuthService` - Authentication

### File Structure
```
src/app/
├── services/
│   └── allergen-detection.service.ts
├── components/
│   └── meal-allergen-card/
│       ├── meal-allergen-card.component.ts
│       ├── meal-allergen-card.component.html
│       └── meal-allergen-card.component.scss
├── pages/
│   └── allergen-profile/
│       ├── allergen-profile.page.ts
│       ├── allergen-profile.page.html
│       └── allergen-profile.page.scss
└── home/
    ├── home.page.html (updated)
    ├── home.page.ts (updated)
    └── home.page.scss (updated)
```

## Testing

Run the allergen detection test:
```typescript
import { testAllergenDetection } from './test-allergen-detection';
testAllergenDetection();
```

This will test the system with sample Filipino meals and show expected allergen warnings.

## Future Enhancements

1. **Machine Learning**: Improve ingredient recognition with ML models
2. **Nutrition Integration**: Combine with nutrition analysis
3. **Severity Levels**: Different allergy severity handling
4. **Restaurant Integration**: Allow restaurants to mark allergen-free options
5. **Offline Support**: Local allergen database for offline use

## Support

For questions or issues with the allergen detection system, contact the development team or refer to the main KaPlato documentation.
