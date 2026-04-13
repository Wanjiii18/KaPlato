import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MealFilterComponent } from '../components/meal-filter/meal-filter.component';
import { MealFilterService, MealFilterOptions, FilterStats } from '../services/meal-filter.service';
import { MenuService } from '../services/menu.service';
import { AllergenDetectionService } from '../services/allergen-detection.service';

@Component({
  selector: 'app-meals-browse',
  templateUrl: './meals-browse.page.html',
  styleUrls: ['./meals-browse.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MealFilterComponent]
})
export class MealsBrowsePage implements OnInit, OnDestroy {
  allMeals: any[] = [];
  filteredMeals: any[] = [];
  isLoading = true;
  showFilters = false;
  currentFilters: MealFilterOptions = {};
  filterStats: FilterStats | null = null;
  private menuItemsSubscription: Subscription | null = null;
  activeAllergens: string[] = [];
  avoidRiskyDishes = true;

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private mealFilterService: MealFilterService,
    private menuService: MenuService,
    private allergenDetectionService: AllergenDetectionService
  ) {}

  async ngOnInit() {
    this.initializeAllergenDefaults();
    await this.loadMeals();
    this.checkQueryParams();
  }

  private initializeAllergenDefaults() {
    const effectiveAllergens = this.allergenDetectionService.getEffectiveUserAllergens();
    this.activeAllergens = effectiveAllergens.map(allergen => allergen.name);

    if (this.activeAllergens.length > 0 && this.avoidRiskyDishes) {
      this.currentFilters.allergenSafe = true;
      this.currentFilters.specificAllergens = [...this.activeAllergens];
    }
  }

  async ionViewWillEnter() {
    // Refresh data every time the user enters this page
    await this.refreshMeals();
  }

  async refreshMeals() {
    // Force reload from backend to get the latest menu items
    await this.menuService.loadMenuItems();
  }

  async doRefresh(event: any) {
    try {
      await this.refreshMeals();
      await this.showToast('Meals refreshed!');
    } catch (error) {
      console.error('Error refreshing meals:', error);
      await this.showToast('Failed to refresh meals');
    } finally {
      event.target.complete();
    }
  }

  private checkQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.currentFilters.category = params['category'];
      }
      if (params['maxBudget']) {
        this.currentFilters.maxBudget = parseInt(params['maxBudget']);
      }
      if (params['allergenSafe']) {
        this.currentFilters.allergenSafe = params['allergenSafe'] === 'true';
      }
      this.applyFilters();
    });
  }

  async loadMeals() {
    this.isLoading = true;
    try {
      // Unsubscribe from previous subscription if exists
      if (this.menuItemsSubscription) {
        this.menuItemsSubscription.unsubscribe();
      }
      
      // Subscribe to real menu items from the backend
      this.menuItemsSubscription = this.menuService.menuItems$.subscribe(menuItems => {
        console.log('Loaded menu items from backend:', menuItems);
        this.allMeals = menuItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          calories: item.nutritionalInfo?.calories || 0,
          protein: item.nutritionalInfo?.protein || 0,
          carbs: item.nutritionalInfo?.carbs || 0,
          fat: item.nutritionalInfo?.fat || 0,
          image: item.image,
          karenderia_name: (item as any).karenderia_name || 'Unknown Karenderia',
          karenderia_id: (item as any).karenderia_id || '',
          category: item.category,
          spicyLevel: this.mapSpiciness((item as any).spiciness_level),
          isVegetarian: item.allergens?.length === 0 || false,
          isVegan: false, // Would need dietary tags from backend
          allergens: item.allergens || [],
          ingredients: item.ingredients?.map(ing =>
            typeof ing === 'string' ? ing : ((ing as any).ingredientName || (ing as any).name || '')
          ) || [],
          average_rating: (item as any).average_rating || 0,
          total_reviews: (item as any).total_reviews || 0,
          available: item.isAvailable !== false
        }));
        
        this.filteredMeals = [...this.allMeals];
        this.updateFilterStats();
        this.isLoading = false;
      });
      
      // Force reload menu items from backend
      await this.menuService.loadMenuItems();
      
    } catch (error) {
      console.error('Error loading meals:', error);
      this.allMeals = [];
      this.filteredMeals = [];
      this.updateFilterStats();
      await this.showToast('Failed to load meals from server');
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    if (this.menuItemsSubscription) {
      this.menuItemsSubscription.unsubscribe();
    }
  }

  private mapSpiciness(level: number | undefined): string {
    if (!level) return 'none';
    if (level <= 1) return 'none';
    if (level <= 2) return 'mild';
    if (level <= 4) return 'medium';
    return 'hot';
  }

  async onFiltersChanged(filters: MealFilterOptions) {
    this.currentFilters = filters;
    await this.applyFilters();
  }

  async toggleAvoidRiskyDishes(enabled: boolean) {
    this.avoidRiskyDishes = enabled;

    if (enabled) {
      this.currentFilters.allergenSafe = true;
      this.currentFilters.specificAllergens = [...this.activeAllergens];
    } else {
      this.currentFilters.allergenSafe = false;
      this.currentFilters.specificAllergens = [];
    }

    await this.applyFilters();
  }

  async applyFilters() {
    const loading = await this.loadingController.create({
      message: 'Applying filters...',
      duration: 500
    });
    await loading.present();

    try {
      this.filteredMeals = await this.mealFilterService.filterMeals(this.allMeals, this.currentFilters);
      this.updateFilterStats();
    } catch (error) {
      console.error('Error applying filters:', error);
      await this.showToast('Error applying filters');
    } finally {
      await loading.dismiss();
    }
  }

  onPresetApplied(presetName: string) {
    this.showToast(`Applied ${presetName} filter`);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  async clearAllFilters() {
    this.currentFilters = this.mealFilterService.getDefaultFilters();
    await this.applyFilters();
    this.showToast('Filters cleared');
  }

  viewMealDetails(meal: any) {
    this.navController.navigateForward(['/meal-details', meal.id], {
      state: { menuItem: meal }
    });
  }

  goBack() {
    this.navController.back();
  }

  private updateFilterStats() {
    this.filterStats = this.mealFilterService.getFilterStats(this.allMeals, this.filteredMeals);
  }

  hasActiveAllergens(): boolean {
    return this.activeAllergens.length > 0;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  // Helper methods for template
  getSpicyIcon(level: string): string {
    switch (level) {
      case 'hot': return 'bonfire';
      case 'medium': return 'flame';
      case 'mild': return 'flame-outline';
      default: return 'leaf-outline';
    }
  }

  getSpicyColor(level: string): string {
    switch (level) {
      case 'hot': return 'danger';
      case 'medium': return 'warning';
      case 'mild': return 'primary';
      default: return 'success';
    }
  }

  trackByMealId(index: number, meal: any): string {
    return meal.id;
  }
}
