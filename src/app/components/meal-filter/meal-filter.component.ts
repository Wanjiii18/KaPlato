import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MealFilterOptions, MealFilterService } from '../../services/meal-filter.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-meal-filter',
  templateUrl: './meal-filter.component.html',
  styleUrls: ['./meal-filter.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MealFilterComponent implements OnInit {
  @Input() currentFilters: MealFilterOptions = {};
  @Input() showDistanceFilter = false;
  @Output() filtersChanged = new EventEmitter<MealFilterOptions>();
  @Output() presetsApplied = new EventEmitter<string>();

  filters: MealFilterOptions = {};
  showAdvanced = false;
  userAllergens: string[] = [];

  readonly categories = [
    { id: 'all', name: 'All Categories', icon: 'fast-food-outline' },
    { id: 'rice', name: 'Rice Meals', icon: 'restaurant-outline' },
    { id: 'noodles', name: 'Noodles', icon: 'nutrition-outline' },
    { id: 'soup', name: 'Soups', icon: 'bowl-outline' },
    { id: 'grilled', name: 'Grilled', icon: 'flame-outline' },
    { id: 'fried', name: 'Fried', icon: 'sunny-outline' },
    { id: 'dessert', name: 'Desserts', icon: 'ice-cream-outline' },
    { id: 'drinks', name: 'Drinks', icon: 'wine-outline' }
  ];

  readonly spicyLevels = [
    { id: 'all', name: 'Any Spice Level', icon: 'help-outline' },
    { id: 'none', name: 'Not Spicy', icon: 'leaf-outline' },
    { id: 'mild', name: 'Mild', icon: 'flame-outline' },
    { id: 'medium', name: 'Medium', icon: 'flame' },
    { id: 'hot', name: 'Hot', icon: 'bonfire-outline' }
  ];

  readonly sortOptions = [
    { id: 'popularity', name: 'Most Popular', icon: 'trending-up-outline' },
    { id: 'rating', name: 'Highest Rated', icon: 'star-outline' },
    { id: 'price', name: 'Price', icon: 'cash-outline' },
    { id: 'calories', name: 'Calories', icon: 'fitness-outline' },
    { id: 'distance', name: 'Distance', icon: 'location-outline' }
  ];

  constructor(
    private mealFilterService: MealFilterService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    this.filters = { ...this.currentFilters };
    await this.loadUserAllergens();
  }

  private async loadUserAllergens() {
    try {
      const userProfile = await this.userService.getCurrentUserProfile();
      this.userAllergens = userProfile?.allergens || [];
    } catch (error) {
      console.error('Error loading user allergens:', error);
      this.userAllergens = [];
    }
  }

  onFilterChange() {
    this.filtersChanged.emit(this.filters);
  }

  applyPreset(presetName: string) {
    const presets = this.mealFilterService.getFilterPresets();
    if (presets[presetName]) {
      this.filters = { ...presets[presetName] };
      this.presetsApplied.emit(presetName);
      this.onFilterChange();
    }
  }

  resetFilters() {
    this.filters = this.mealFilterService.getDefaultFilters();
    this.showAdvanced = false;
    this.onFilterChange();
  }

  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  toggleAllergenSafe() {
    this.filters.allergenSafe = !this.filters.allergenSafe;
    this.onFilterChange();
  }

  toggleVegetarian() {
    this.filters.isVegetarian = !this.filters.isVegetarian;
    this.onFilterChange();
  }

  toggleVegan() {
    this.filters.isVegan = !this.filters.isVegan;
    this.onFilterChange();
  }

  onBudgetChange() {
    // Ensure min is not greater than max
    if (this.filters.minBudget && this.filters.maxBudget && 
        this.filters.minBudget > this.filters.maxBudget) {
      this.filters.minBudget = this.filters.maxBudget;
    }
    this.onFilterChange();
  }

  onCalorieChange() {
    // Ensure min is not greater than max
    if (this.filters.minCalories && this.filters.maxCalories && 
        this.filters.minCalories > this.filters.maxCalories) {
      this.filters.minCalories = this.filters.maxCalories;
    }
    this.onFilterChange();
  }

  onSortChange() {
    this.onFilterChange();
  }

  onCategorySelect(categoryId: string) {
    this.filters.category = categoryId;
    this.onFilterChange();
  }

  onSpicyLevelSelect(spicyLevel: string) {
    this.filters.spicyLevel = spicyLevel;
    this.onFilterChange();
  }

  getBudgetRangeText(): string {
    const min = this.filters.minBudget || 0;
    const max = this.filters.maxBudget || 500;
    return `₱${min} - ₱${max}`;
  }

  getCalorieRangeText(): string {
    const min = this.filters.minCalories || 0;
    const max = this.filters.maxCalories || 1000;
    return `${min} - ${max} kcal`;
  }

  getDistanceText(): string {
    const distance = this.filters.maxDistance || 10;
    return `Within ${distance} km`;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.category && this.filters.category !== 'all') count++;
    if (this.filters.spicyLevel && this.filters.spicyLevel !== 'all') count++;
    if (this.filters.maxBudget) count++;
    if (this.filters.minBudget) count++;
    if (this.filters.maxCalories) count++;
    if (this.filters.minCalories) count++;
    if (this.filters.allergenSafe) count++;
    if (this.filters.isVegetarian) count++;
    if (this.filters.isVegan) count++;
    if (this.filters.maxDistance) count++;
    return count;
  }
}
