import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { MealFilterComponent } from '../components/meal-filter/meal-filter.component';
import { MealFilterService, MealFilterOptions, FilterStats } from '../services/meal-filter.service';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-meals-browse',
  templateUrl: './meals-browse.page.html',
  styleUrls: ['./meals-browse.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MealFilterComponent]
})
export class MealsBrowsePage implements OnInit {
  allMeals: any[] = [];
  filteredMeals: any[] = [];
  isLoading = true;
  showFilters = false;
  currentFilters: MealFilterOptions = {};
  filterStats: FilterStats | null = null;
  
  // Sample meal data (replace with actual API calls)
  sampleMeals = [
    {
      id: '1',
      name: 'Adobong Manok',
      description: 'Classic Filipino chicken adobo with soy sauce and vinegar',
      price: 120,
      calories: 350,
      protein: 28,
      carbs: 15,
      fat: 18,
      image: 'assets/images/adobo.jpg',
      karenderia_name: 'Lola\'s Kitchen',
      karenderia_id: 'k1',
      category: 'rice',
      spicyLevel: 'mild',
      isVegetarian: false,
      isVegan: false,
      allergens: ['soy'],
      ingredients: ['chicken', 'soy sauce', 'vinegar', 'garlic', 'bay leaves'],
      average_rating: 4.5,
      total_reviews: 25,
      available: true
    },
    {
      id: '2',
      name: 'Pancit Canton',
      description: 'Stir-fried egg noodles with vegetables and meat',
      price: 80,
      calories: 280,
      protein: 12,
      carbs: 45,
      fat: 8,
      image: 'assets/images/pancit.jpg',
      karenderia_name: 'Tita\'s Place',
      karenderia_id: 'k2',
      category: 'noodles',
      spicyLevel: 'none',
      isVegetarian: false,
      isVegan: false,
      allergens: ['wheat', 'eggs'],
      ingredients: ['canton noodles', 'cabbage', 'carrots', 'pork', 'soy sauce'],
      average_rating: 4.2,
      total_reviews: 18,
      available: true
    },
    {
      id: '3',
      name: 'Sinigang na Baboy',
      description: 'Sour pork soup with vegetables',
      price: 150,
      calories: 220,
      protein: 20,
      carbs: 12,
      fat: 10,
      image: 'assets/images/sinigang.jpg',
      karenderia_name: 'Bahay Kubo',
      karenderia_id: 'k3',
      category: 'soup',
      spicyLevel: 'none',
      isVegetarian: false,
      isVegan: false,
      allergens: [],
      ingredients: ['pork', 'tamarind', 'kangkong', 'radish', 'tomatoes', 'onions'],
      average_rating: 4.8,
      total_reviews: 32,
      available: true
    },
    {
      id: '4',
      name: 'Vegetable Lumpia',
      description: 'Fresh spring rolls with mixed vegetables',
      price: 60,
      calories: 150,
      protein: 5,
      carbs: 25,
      fat: 4,
      image: 'assets/images/lumpia.jpg',
      karenderia_name: 'Green Garden',
      karenderia_id: 'k4',
      category: 'appetizer',
      spicyLevel: 'none',
      isVegetarian: true,
      isVegan: true,
      allergens: [],
      ingredients: ['lettuce', 'carrots', 'bean sprouts', 'tofu', 'lumpia wrapper'],
      average_rating: 4.0,
      total_reviews: 15,
      available: true
    },
    {
      id: '5',
      name: 'Spicy Bicol Express',
      description: 'Pork cooked in coconut milk with chili peppers',
      price: 140,
      calories: 420,
      protein: 25,
      carbs: 8,
      fat: 32,
      image: 'assets/images/bicol.jpg',
      karenderia_name: 'Spice House',
      karenderia_id: 'k5',
      category: 'rice',
      spicyLevel: 'hot',
      isVegetarian: false,
      isVegan: false,
      allergens: ['dairy'],
      ingredients: ['pork', 'coconut milk', 'chili peppers', 'shrimp paste', 'onions'],
      average_rating: 4.6,
      total_reviews: 28,
      available: true
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private mealFilterService: MealFilterService,
    private menuService: MenuService
  ) {}

  async ngOnInit() {
    await this.loadMeals();
    this.checkQueryParams();
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
      // For demo purposes, use sample data
      // In production, replace with: this.allMeals = await this.menuService.getAllMenuItems();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      this.allMeals = [...this.sampleMeals];
      this.filteredMeals = [...this.allMeals];
      this.updateFilterStats();
    } catch (error) {
      console.error('Error loading meals:', error);
      await this.showToast('Failed to load meals');
    } finally {
      this.isLoading = false;
    }
  }

  async onFiltersChanged(filters: MealFilterOptions) {
    this.currentFilters = filters;
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
