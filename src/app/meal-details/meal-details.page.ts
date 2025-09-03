import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../services/favorites.service';
import { MenuService } from '../services/menu.service';
import { SpoonacularService, SpoonacularNutrition } from '../services/spoonacular.service';
import { AllergenDetectionService } from '../services/allergen-detection.service';
import { UserService } from '../services/user.service';

export interface MenuItemDetails {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  karenderia_id: string;
  karenderia_name: string;
  karenderia_address?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
  ingredients?: string[];
  dietary_tags?: string[];
  spiciness_level?: number;
  preparation_time?: number;
  average_rating?: number;
  total_reviews?: number;
  reviews?: Review[];
  available: boolean;
  category?: string;
}

export interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: Date;
  helpful_count?: number;
}

@Component({
  selector: 'app-meal-details',
  templateUrl: './meal-details.page.html',
  styleUrls: ['./meal-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MealDetailsPage implements OnInit, OnDestroy {
  menuItem: MenuItemDetails | null = null;
  loading = true;
  isFavorite = false;
  favoriteId: string | null = null;
  showAllReviews = false;
  userRating = 0;
  userReview = '';
  showReviewForm = false;

  // New properties for nutrition and allergen analysis
  nutritionData: SpoonacularNutrition | null = null;
  allergenAnalysis: {
    warnings: string[];
    safetyLevel: 'safe' | 'caution' | 'danger';
    recommendations: string[];
  } | null = null;
  userAllergens: string[] = [];
  showNutritionDetails = false;
  loadingNutrition = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    private favoritesService: FavoritesService,
    private menuService: MenuService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private spoonacularService: SpoonacularService,
    private allergenService: AllergenDetectionService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    const menuItemId = this.route.snapshot.paramMap.get('id');
    if (menuItemId) {
      await this.loadMenuItemDetails(menuItemId);
      this.checkIfFavorite(menuItemId);
      await this.loadUserAllergens();
      await this.loadNutritionAndAllergenData();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadMenuItemDetails(id: string) {
    this.loading = true;
    try {
      // First try to get detailed item from API
      this.menuItem = await this.menuService.getMenuItemDetails(id);
      console.log('=== DEBUGGING INGREDIENTS ===');
      console.log('Menu item from API:', this.menuItem);
      console.log('Ingredients field:', this.menuItem?.ingredients);
      console.log('Ingredients type:', typeof this.menuItem?.ingredients);
      console.log('Is ingredients array?', Array.isArray(this.menuItem?.ingredients));
      
      // Check all properties of the menu item
      if (this.menuItem) {
        console.log('All menu item properties:', Object.keys(this.menuItem));
        console.log('Full menu item object:', JSON.stringify(this.menuItem, null, 2));
      }
      
      // Always try to get ingredients from the main menu items list as well
      this.menuService.menuItems$.subscribe(menuItems => {
        const foundItem = menuItems.find(item => item.id === id);
        if (foundItem) {
          console.log('Found item from menu list:', foundItem);
          console.log('Menu list item ingredients:', foundItem.ingredients);
          
          // Merge the detailed info with ingredients from menu list
          if (this.menuItem) {
            // If API doesn't have ingredients but menu list does, use menu list ingredients
            if ((!this.menuItem.ingredients || this.menuItem.ingredients.length === 0) && foundItem.ingredients) {
              this.menuItem.ingredients = foundItem.ingredients.map(ing => ing.ingredientName);
              console.log('Updated ingredients from menu list:', this.menuItem.ingredients);
            }
            
            // Also merge other missing fields using type assertion for extended properties
            const extendedMenuItem = this.menuItem as any;
            const extendedFoundItem = foundItem as any;
            
            if (!extendedMenuItem.karenderia_name && extendedFoundItem.karenderia_name) {
              extendedMenuItem.karenderia_name = extendedFoundItem.karenderia_name;
            }
            if (!extendedMenuItem.karenderia_id && extendedFoundItem.karenderia_id) {
              extendedMenuItem.karenderia_id = extendedFoundItem.karenderia_id;
            }
          }
        } else {
          console.log('No matching item found in menu items list for id:', id);
        }
      });
      
      // Force reload menu items to ensure we have the latest data
      await this.menuService.loadMenuItems();
      
    } catch (error) {
      console.error('Error loading menu item:', error);
      await this.showErrorToast('Failed to load meal details');
      this.navController.back();
    } finally {
      this.loading = false;
    }
  }

  checkIfFavorite(menuItemId: string) {
    this.isFavorite = this.favoritesService.isFavorite(menuItemId);
    this.favoriteId = this.favoritesService.getFavoriteId(menuItemId);
  }

  async shareMenu() {
    if (!this.menuItem) return;
    
    try {
      const shareData = {
        title: this.menuItem.name,
        text: `Check out ${this.menuItem.name} from ${this.menuItem.karenderia_name} - ₱${this.menuItem.price}`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        const toast = await this.toastController.create({
          message: 'Link copied to clipboard!',
          duration: 2000,
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  async viewSimilarMeals() {
    if (!this.menuItem) return;
    
    try {
      // Navigate to filtered meals based on category or karenderia
      this.navController.navigateForward(`/meals-browse`, {
        queryParams: {
          category: this.menuItem.category,
          karenderia: this.menuItem.karenderia_id
        }
      });
    } catch (error) {
      console.error('Error navigating to similar meals:', error);
    }
  }

  async viewReviews() {
    if (!this.menuItem || !this.menuItem.reviews) return;
    
    const alert = await this.alertController.create({
      header: `Reviews for ${this.menuItem.name}`,
      message: this.getReviewsPreview(),
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        },
        {
          text: 'Write Review',
          handler: () => {
            this.showReviewForm = true;
          }
        }
      ]
    });
    
    await alert.present();
  }

  private getReviewsPreview(): string {
    if (!this.menuItem?.reviews) return 'No reviews yet.';
    
    return this.menuItem.reviews
      .slice(0, 3)
      .map(review => `⭐ ${review.rating}/5 - ${review.comment}`)
      .join('\n\n');
  }

  async toggleFavorite() {
    if (!this.menuItem) return;

    const loading = await this.loadingController.create({
      message: this.isFavorite ? 'Removing from favorites...' : 'Adding to favorites...'
    });
    await loading.present();

    try {
      if (this.isFavorite && this.favoriteId) {
        await this.favoritesService.removeFromFavorites(this.favoriteId);
        await this.showToast('Removed from favorites');
      } else {
        await this.favoritesService.addToFavorites(this.menuItem.id, this.menuItem.karenderia_id);
        await this.showToast('Added to favorites');
      }
      
      this.checkIfFavorite(this.menuItem.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showErrorToast('Failed to update favorites');
    } finally {
      await loading.dismiss();
    }
  }

  async submitReview() {
    if (!this.menuItem || this.userRating === 0) {
      await this.showErrorToast('Please provide a rating');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting review...'
    });
    await loading.present();

    try {
      // Submit review to backend
      await this.menuService.submitReview(this.menuItem.id, this.userRating, this.userReview);
      
      await this.showToast('Review submitted successfully');
      this.showReviewForm = false;
      this.userRating = 0;
      this.userReview = '';
      
      // Reload menu item to get updated reviews
      await this.loadMenuItemDetails(this.menuItem.id);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      await this.showErrorToast('Failed to submit review');
    } finally {
      await loading.dismiss();
    }
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('star');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('star-half');
      } else {
        stars.push('star-outline');
      }
    }
    return stars;
  }

  setUserRating(rating: number) {
    this.userRating = rating;
  }

  getVisibleReviews(): Review[] {
    if (!this.menuItem?.reviews) return [];
    return this.showAllReviews ? this.menuItem.reviews : this.menuItem.reviews.slice(0, 3);
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  async goToKarenderia() {
    if (this.menuItem?.karenderia_id) {
      this.navController.navigateForward(['/karenderia', this.menuItem.karenderia_id]);
    }
  }

  goBack() {
    this.navController.back();
  }

  // New methods for nutrition and allergen analysis
  async loadUserAllergens() {
    try {
      const profile = await this.userService.getCurrentUserProfile();
      if (profile?.allergens) {
        this.userAllergens = profile.allergens.map(a => a.name);
      }
    } catch (error) {
      console.error('Error loading user allergens:', error);
    }
  }

  async loadNutritionAndAllergenData() {
    if (!this.menuItem?.name) return;
    
    this.loadingNutrition = true;
    try {
      // Search for the recipe using the meal name
      const searchResults = await this.spoonacularService.searchRecipes(this.menuItem.name, undefined, undefined, undefined, 1).toPromise();
      
      if (searchResults && searchResults.results.length > 0) {
        const recipe = searchResults.results[0];
        
        // Get detailed analysis
        const analysis = await this.spoonacularService.getMealAnalysisWithAllergens(recipe.id, this.userAllergens).toPromise();
        
        if (analysis) {
          this.nutritionData = analysis.nutrition;
          this.allergenAnalysis = {
            warnings: analysis.allergenWarnings,
            safetyLevel: analysis.safetyLevel,
            recommendations: analysis.recommendations
          };
          
          // Update the menu item with nutrition data if not already present
          if (!this.menuItem.calories && this.nutritionData) {
            this.menuItem.calories = this.nutritionData.calories;
            this.menuItem.protein = this.parseNutrientValue(this.nutritionData.protein);
            this.menuItem.carbs = this.parseNutrientValue(this.nutritionData.carbs);
            this.menuItem.fat = this.parseNutrientValue(this.nutritionData.fat);
          }
        }
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      // Fallback to basic allergen analysis using local detection
      if (this.menuItem.ingredients) {
        const localAnalysis = this.allergenService.analyzeMealSafety(this.menuItem.ingredients, this.menuItem.name);
        this.allergenAnalysis = {
          warnings: localAnalysis.warnings.map(w => w.allergen),
          safetyLevel: localAnalysis.riskLevel === 'low' ? 'safe' : localAnalysis.riskLevel === 'medium' ? 'caution' : 'danger',
          recommendations: localAnalysis.safeAlternatives || ['Check ingredients carefully']
        };
      }
    } finally {
      this.loadingNutrition = false;
    }
  }

  toggleNutritionDetails() {
    this.showNutritionDetails = !this.showNutritionDetails;
  }

  getNutritionColor(nutrientName: string): string {
    switch (nutrientName.toLowerCase()) {
      case 'calories': return 'warning';
      case 'protein': return 'success';
      case 'carbs': return 'primary';
      case 'fat': return 'tertiary';
      case 'fiber': return 'success';
      case 'sodium': return 'danger';
      case 'sugar': return 'warning';
      default: return 'medium';
    }
  }

  getSafetyLevelColor(): string {
    if (!this.allergenAnalysis) return 'medium';
    
    switch (this.allergenAnalysis.safetyLevel) {
      case 'safe': return 'success';
      case 'caution': return 'warning';
      case 'danger': return 'danger';
      default: return 'medium';
    }
  }

  getSafetyLevelIcon(): string {
    if (!this.allergenAnalysis) return 'help-circle';
    
    switch (this.allergenAnalysis.safetyLevel) {
      case 'safe': return 'checkmark-circle';
      case 'caution': return 'warning';
      case 'danger': return 'close-circle';
      default: return 'help-circle';
    }
  }

  // Helper methods for template null safety
  hasAllergenWarnings(): boolean {
    return !!(this.allergenAnalysis?.warnings && this.allergenAnalysis.warnings.length > 0);
  }

  hasAllergenRecommendations(): boolean {
    return !!(this.allergenAnalysis?.recommendations && this.allergenAnalysis.recommendations.length > 0);
  }

  shouldShowGeneralAllergens(): boolean {
    const hasMenuAllergens = !!(this.menuItem?.allergens && this.menuItem.allergens.length > 0);
    const hasNoWarnings = !this.allergenAnalysis?.warnings || this.allergenAnalysis.warnings.length === 0;
    return hasMenuAllergens && hasNoWarnings;
  }

  private parseNutrientValue(nutrientString: string): number {
    if (!nutrientString) return 0;
    const match = nutrientString.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : 0;
  }

  // Public method for template use
  parseNutrientValueSafe(nutrientString: string | undefined): number {
    if (!nutrientString) return 0;
    const match = nutrientString.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : 0;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  getIngredientsList(): string[] {
    console.log('=== getIngredientsList() called ===');
    if (!this.menuItem) {
      console.log('No menu item available');
      return [];
    }
    
    console.log('Menu item ingredients field:', this.menuItem.ingredients);
    console.log('Type of ingredients:', typeof this.menuItem.ingredients);
    console.log('Is ingredients array?', Array.isArray(this.menuItem.ingredients));
    console.log('Ingredients length:', this.menuItem.ingredients?.length);
    
    // Handle different ingredient formats from backend
    let ingredients: string[] = [];
    
    // Check if ingredients exist and is an array (Laravel casts it as array)
    if (this.menuItem.ingredients && Array.isArray(this.menuItem.ingredients)) {
      console.log('Processing ingredients array:', this.menuItem.ingredients);
      ingredients = this.menuItem.ingredients.filter((ing: any) => {
        if (typeof ing === 'string') {
          return ing.trim().length > 0;
        }
        // If it's an object with ingredientName property
        if (ing && typeof ing === 'object' && ing.ingredientName) {
          return ing.ingredientName.trim().length > 0;
        }
        // If it's an object with name property
        if (ing && typeof ing === 'object' && ing.name) {
          return ing.name.trim().length > 0;
        }
        return false;
      }).map((ing: any) => {
        if (typeof ing === 'string') {
          return ing;
        }
        if (ing && typeof ing === 'object' && ing.ingredientName) {
          return ing.ingredientName;
        }
        if (ing && typeof ing === 'object' && ing.name) {
          return ing.name;
        }
        return '';
      });
    }
    
    // If ingredients is a string (comma-separated) - fallback
    else if (typeof this.menuItem.ingredients === 'string') {
      console.log('Processing ingredients string:', this.menuItem.ingredients);
      ingredients = (this.menuItem.ingredients as string)
        .split(',')
        .map((ing: string) => ing.trim())
        .filter((ing: string) => ing.length > 0);
    }
    
    else {
      console.log('Ingredients is null, undefined, or unknown type');
    }
    
    console.log('Final processed ingredients:', ingredients);
    
    // Remove duplicates and return
    return [...new Set(ingredients)];
  }
}
