import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonChip,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  ToastController,
  AlertController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  nutrition,
  warning,
  shield,
  calculator,
  search,
  filter,
  add,
  settings,
  information,
  checkmark,
  close,
  alert,
  star,
  heart,
  leaf,
  flame,
  restaurant,
  medkit,
  fitness
} from 'ionicons/icons';

import { NutritionAllergenService, AllergenInfo, DishAnalysis } from '../../services/nutrition-allergen.service';
import { AuthService } from '../../services/auth.service';

// Add icons
addIcons({
  nutrition,
  warning,
  shield,
  calculator,
  search,
  filter,
  add,
  settings,
  information,
  checkmark,
  close,
  alert,
  star,
  heart,
  leaf,
  flame,
  restaurant,
  medkit,
  fitness
});

interface UserAllergenProfile {
  id?: number;
  user_id: number;
  allergens: string[];
  dietary_preferences: string[];
  calorie_goal?: number;
  protein_goal?: number;
  carb_goal?: number;
  fat_goal?: number;
  fiber_goal?: number;
  sodium_limit?: number;
  sugar_limit?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface MealAnalysisResult {
  dish_name: string;
  ingredients: string[];
  allergen_alerts: {
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    found_in: string[];
    alternatives?: string[];
  }[];
  nutrition_facts: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
  };
  health_score: number;
  recommendations: string[];
  is_safe: boolean;
}

@Component({
  selector: 'app-nutrition-engine',
  templateUrl: './nutrition-engine.page.html',
  styleUrls: ['./nutrition-engine.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonChip,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonList,
    IonSearchbar,
    IonSpinner,
    IonText,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton
  ]
})
export class NutritionEnginePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // View state
  selectedSegment: 'scanner' | 'calculator' | 'profile' = 'scanner';
  isLoading = false;
  
  // User profile
  userProfile: UserAllergenProfile | null = null;
  
  // Allergen detection
  searchQuery = '';
  scannedMeals: MealAnalysisResult[] = [];
  availableAllergens: AllergenInfo[] = [];
  
  // Calorie calculator
  selectedIngredients: { name: string; quantity: number; unit: string }[] = [];
  calculationResult: any = null;
  
  // Mock meal data for demonstration
  sampleMeals = [
    {
      name: 'Chicken Adobo with Rice',
      ingredients: ['chicken', 'soy sauce', 'vinegar', 'garlic', 'rice', 'bay leaves'],
      image: 'assets/images/adobo.jpg'
    },
    {
      name: 'Beef Mechado',
      ingredients: ['beef', 'tomato sauce', 'potatoes', 'onions', 'bell peppers'],
      image: 'assets/images/mechado.jpg'
    },
    {
      name: 'Pancit Canton',
      ingredients: ['wheat noodles', 'pork', 'shrimp', 'vegetables', 'soy sauce'],
      image: 'assets/images/pancit.jpg'
    },
    {
      name: 'Lumpia Shanghai',
      ingredients: ['ground pork', 'wheat wrapper', 'carrots', 'onions', 'eggs'],
      image: 'assets/images/lumpia.jpg'
    }
  ];
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private nutritionService: NutritionAllergenService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadAvailableAllergens();
    this.runDemoAnalysis();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // User Profile Management
  async loadUserProfile() {
    try {
      // Mock user profile - replace with actual API call
      this.userProfile = {
        id: 1,
        user_id: 1,
        allergens: ['peanuts', 'shellfish', 'dairy'],
        dietary_preferences: ['low-sodium', 'high-protein'],
        calorie_goal: 2000,
        protein_goal: 150,
        carb_goal: 250,
        fat_goal: 65,
        fiber_goal: 25,
        sodium_limit: 2300,
        sugar_limit: 50
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async updateUserProfile() {
    const alert = await this.alertController.create({
      header: 'Update Dietary Profile',
      message: 'Set your dietary preferences and restrictions',
      inputs: [
        {
          name: 'calorieGoal',
          type: 'number',
          placeholder: 'Daily calorie goal',
          value: this.userProfile?.calorie_goal
        },
        {
          name: 'proteinGoal',
          type: 'number',
          placeholder: 'Protein goal (g)',
          value: this.userProfile?.protein_goal
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (this.userProfile) {
              this.userProfile.calorie_goal = parseInt(data.calorieGoal);
              this.userProfile.protein_goal = parseInt(data.proteinGoal);
              this.showToast('Profile updated successfully', 'success');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Allergen Detection
  loadAvailableAllergens() {
    // Load allergens from service - using mock data for now
    this.availableAllergens = [
      {
        allergen: 'Peanuts',
        severity: 'severe',
        description: 'Tree nuts and peanut products',
        alternatives: ['sunflower seeds', 'pumpkin seeds']
      },
      {
        allergen: 'Shellfish', 
        severity: 'severe',
        description: 'Crustaceans and mollusks',
        alternatives: ['fish', 'chicken', 'tofu']
      },
      {
        allergen: 'Dairy',
        severity: 'moderate',
        description: 'Milk and dairy products',
        alternatives: ['coconut milk', 'almond milk', 'soy milk']
      }
    ];
  }

  async scanMeal(meal: any) {
    this.isLoading = true;
    
    try {
      // Simulate meal analysis
      const analysis = await this.analyzeMeal(meal);
      this.scannedMeals.unshift(analysis);
      
      // Show alert if allergens detected
      if (!analysis.is_safe && analysis.allergen_alerts.length > 0) {
        await this.showAllergenAlert(analysis);
      }
      
    } catch (error) {
      console.error('Error scanning meal:', error);
      this.showToast('Error analyzing meal', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async analyzeMeal(meal: any): Promise<MealAnalysisResult> {
    // Use the nutrition service to analyze the meal
    const dishAnalysis = this.nutritionService.analyzeDish(meal.ingredients, 300); // 300g serving
    
    // Check for user allergens
    const userAllergens = this.userProfile?.allergens || [];
    const allergenAlerts = [];
    
    // Common allergen sources mapping
    const allergenSources: { [key: string]: string[] } = {
      'peanuts': ['peanuts', 'peanut oil', 'nuts'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'oysters'],
      'dairy': ['milk', 'cheese', 'butter', 'cream'],
      'wheat': ['wheat', 'flour', 'bread'],
      'eggs': ['eggs', 'egg'],
      'soy': ['soy sauce', 'tofu', 'soybean']
    };
    
    for (const allergen of userAllergens) {
      const allergenInfo = this.availableAllergens.find(a => a.allergen.toLowerCase() === allergen.toLowerCase());
      if (allergenInfo) {
        const sources = allergenSources[allergen.toLowerCase()] || [allergen];
        const foundIngredients = meal.ingredients.filter((ingredient: string) => 
          sources.some(source => 
            ingredient.toLowerCase().includes(source.toLowerCase())
          )
        );
        
        if (foundIngredients.length > 0) {
          allergenAlerts.push({
            allergen: allergen,
            severity: allergenInfo.severity,
            found_in: foundIngredients,
            alternatives: allergenInfo.alternatives
          });
        }
      }
    }

    return {
      dish_name: meal.name,
      ingredients: meal.ingredients,
      allergen_alerts: allergenAlerts,
      nutrition_facts: {
        calories: dishAnalysis.totalCalories,
        protein: dishAnalysis.totalNutrition.protein,
        carbohydrates: dishAnalysis.totalNutrition.carbohydrates,
        fat: dishAnalysis.totalNutrition.fat,
        fiber: dishAnalysis.totalNutrition.fiber,
        sodium: dishAnalysis.totalNutrition.sodium,
        sugar: dishAnalysis.totalNutrition.sugar
      },
      health_score: dishAnalysis.healthScore,
      recommendations: dishAnalysis.recommendations,
      is_safe: allergenAlerts.length === 0
    };
  }

  private async showAllergenAlert(analysis: MealAnalysisResult) {
    const alertMessages = analysis.allergen_alerts.map(alert => 
      `⚠️ ${alert.allergen.toUpperCase()}: Found in ${alert.found_in.join(', ')}`
    ).join('\n');

    const alert = await this.alertController.create({
      header: '⚠️ Allergen Alert',
      subHeader: `${analysis.dish_name}`,
      message: `This dish contains allergens you're sensitive to:\n\n${alertMessages}`,
      buttons: [
        {
          text: 'View Alternatives',
          handler: () => {
            this.showAllergenAlternatives(analysis);
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async showAllergenAlternatives(analysis: MealAnalysisResult) {
    const alternatives = analysis.allergen_alerts
      .filter(alert => alert.alternatives && alert.alternatives.length > 0)
      .map(alert => `${alert.allergen}: ${alert.alternatives!.join(', ')}`)
      .join('\n');

    const alert = await this.alertController.create({
      header: 'Suggested Alternatives',
      message: alternatives || 'No specific alternatives available. Consider asking the restaurant about modifications.',
      buttons: ['OK']
    });

    await alert.present();
  }

  // Calorie Calculator
  addIngredient() {
    this.selectedIngredients.push({
      name: '',
      quantity: 100,
      unit: 'g'
    });
  }

  removeIngredient(index: number) {
    this.selectedIngredients.splice(index, 1);
    this.calculateNutrition();
  }

  calculateNutrition() {
    if (this.selectedIngredients.length === 0) {
      this.calculationResult = null;
      return;
    }

    // Filter out empty ingredients
    const validIngredients = this.selectedIngredients.filter(ing => ing.name.trim() !== '');
    
    if (validIngredients.length === 0) {
      this.calculationResult = null;
      return;
    }

    // Calculate nutrition using the service
    const ingredientNames = validIngredients.map(ing => ing.name);
    const totalWeight = validIngredients.reduce((sum, ing) => sum + ing.quantity, 0);
    
    const analysis = this.nutritionService.analyzeDish(ingredientNames, totalWeight);
    
    this.calculationResult = {
      total_calories: analysis.totalCalories,
      total_protein: analysis.totalNutrition.protein,
      total_carbs: analysis.totalNutrition.carbohydrates,
      total_fat: analysis.totalNutrition.fat,
      total_fiber: analysis.totalNutrition.fiber,
      total_sodium: analysis.totalNutrition.sodium,
      total_sugar: analysis.totalNutrition.sugar,
      health_score: analysis.healthScore,
      calorie_breakdown: {
        from_protein: (analysis.totalNutrition.protein * 4),
        from_carbs: (analysis.totalNutrition.carbohydrates * 4),
        from_fat: (analysis.totalNutrition.fat * 9)
      },
      daily_value_percentages: this.calculateDailyValues(analysis)
    };
  }

  private calculateDailyValues(analysis: any) {
    const dailyValues = {
      calories: 2000,
      protein: 50,
      carbs: 300,
      fat: 65,
      fiber: 25,
      sodium: 2300,
      sugar: 50
    };

    return {
      calories: (analysis.totalCalories / dailyValues.calories) * 100,
      protein: (analysis.totalNutrition.protein / dailyValues.protein) * 100,
      carbs: (analysis.totalNutrition.carbohydrates / dailyValues.carbs) * 100,
      fat: (analysis.totalNutrition.fat / dailyValues.fat) * 100,
      fiber: (analysis.totalNutrition.fiber / dailyValues.fiber) * 100,
      sodium: (analysis.totalNutrition.sodium / dailyValues.sodium) * 100,
      sugar: (analysis.totalNutrition.sugar / dailyValues.sugar) * 100
    };
  }

  // Demo and Utility Methods
  runDemoAnalysis() {
    // Automatically analyze first meal for demo
    setTimeout(() => {
      if (this.sampleMeals.length > 0) {
        this.scanMeal(this.sampleMeals[0]);
      }
    }, 1000);
  }

  searchMeals() {
    // Filter sample meals based on search query
    return this.sampleMeals.filter(meal => 
      meal.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      meal.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    );
  }

  getHealthScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  getHealthScoreIcon(score: number): string {
    if (score >= 80) return 'checkmark';
    if (score >= 60) return 'warning';
    return 'close';
  }

  getAllergenSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'primary';
      default: return 'medium';
    }
  }

  // Navigation
  navigateToAllergenProfile() {
    this.router.navigate(['/allergen-profile']);
  }

  navigateToNutritionDatabase() {
    this.router.navigate(['/nutrition-database']);
  }

  // Utility Methods
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  formatNutritionValue(value: number, unit: string = 'g'): string {
    return `${Math.round(value * 10) / 10}${unit}`;
  }

  formatCalories(calories: number): string {
    return `${Math.round(calories)} cal`;
  }

  formatPercentage(percentage: number): string {
    return `${Math.round(percentage)}%`;
  }

  // Template helper methods
  getAllergenSources(allergenAlerts: any[]): string {
    return allergenAlerts.map(a => a.found_in.join(', ')).join('; ');
  }

  roundNumber(value: number): number {
    return Math.round(value);
  }
}
