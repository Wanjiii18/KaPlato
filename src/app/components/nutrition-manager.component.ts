import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnhancedNutritionService, MenuItemNutrition } from '../services/enhanced-nutrition.service';
import { MenuService } from '../services/menu.service';
import { MenuItem } from '../models/menu.model';

@Component({
  selector: 'app-nutrition-manager',
  templateUrl: './nutrition-manager.component.html',
  styleUrls: ['./nutrition-manager.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NutritionManagerComponent implements OnInit {
  
  menuItems: MenuItem[] = [];
  nutritionData: { [itemId: string]: MenuItemNutrition } = {};
  loading = false;
  searchQuery = '';
  selectedFilters = {
    maxCalories: null as number | null,
    minProtein: null as number | null,
    allergenFree: [] as string[],
    spiceLevel: '',
    dietaryTags: [] as string[]
  };

  allergenOptions = ['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'fish', 'shellfish'];
  spiceLevels = ['mild', 'medium', 'spicy', 'very_spicy'];
  dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'healthy'];

  constructor(
    private nutritionService: EnhancedNutritionService,
    private menuService: MenuService
  ) {}

  async ngOnInit() {
    await this.loadMenuItems();
  }

  async loadMenuItems() {
    this.loading = true;
    try {
      this.menuService.menuItems$.subscribe(async (items) => {
        this.menuItems = items;
        await this.loadNutritionForItems();
      });
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadNutritionForItems() {
    for (const item of this.menuItems) {
      if (item.id && item.name) {
        try {
          const ingredientNames = this.extractIngredientNames(item.ingredients);
          const nutrition = await this.nutritionService.getMenuItemNutrition(
            item.name,
            ingredientNames
          );
          if (nutrition) {
            this.nutritionData[item.id] = nutrition;
          }
        } catch (error) {
          console.error(`Error loading nutrition for ${item.name}:`, error);
        }
      }
    }
  }

  private extractIngredientNames(ingredients: any[] | undefined): string[] {
    if (!ingredients) return [];
    
    return ingredients.map(ing => {
      if (typeof ing === 'string') return ing;
      return ing.ingredientName || ing.name || '';
    }).filter(name => name.length > 0);
  }

  getNutritionForItem(itemId: string): MenuItemNutrition | null {
    return this.nutritionData[itemId] || null;
  }

  async searchByNutrition() {
    this.loading = true;
    try {
      const filteredItems = this.menuItems.filter(item => {
        if (!item.id) return false;
        
        const nutrition = this.nutritionData[item.id];
        if (!nutrition) return false;

        // Apply filters
        if (this.selectedFilters.maxCalories && 
            nutrition.nutrition.calories > this.selectedFilters.maxCalories) return false;
        
        if (this.selectedFilters.minProtein && 
            nutrition.nutrition.protein < this.selectedFilters.minProtein) return false;
        
        if (this.selectedFilters.spiceLevel && 
            nutrition.spiceLevel !== this.selectedFilters.spiceLevel) return false;
        
        if (this.selectedFilters.allergenFree.length > 0 &&
            this.selectedFilters.allergenFree.some(allergen => 
              nutrition.allergens.includes(allergen))) return false;
        
        if (this.selectedFilters.dietaryTags.length > 0 &&
            !this.selectedFilters.dietaryTags.every(tag => 
              nutrition.dietaryTags.includes(tag))) return false;

        // Search query
        if (this.searchQuery && 
            !item.name.toLowerCase().includes(this.searchQuery.toLowerCase())) return false;

        return true;
      });

      this.menuItems = filteredItems;
    } catch (error) {
      console.error('Error filtering by nutrition:', error);
    } finally {
      this.loading = false;
    }
  }

  async refreshAllNutrition() {
    this.loading = true;
    try {
      this.nutritionData = {};
      await this.loadNutritionForItems();
    } catch (error) {
      console.error('Error refreshing nutrition:', error);
    } finally {
      this.loading = false;
    }
  }

  clearFilters() {
    this.selectedFilters = {
      maxCalories: null,
      minProtein: null,
      allergenFree: [],
      spiceLevel: '',
      dietaryTags: []
    };
    this.searchQuery = '';
    this.loadMenuItems();
  }

  toggleAllergenFilter(allergen: string) {
    const index = this.selectedFilters.allergenFree.indexOf(allergen);
    if (index >= 0) {
      this.selectedFilters.allergenFree.splice(index, 1);
    } else {
      this.selectedFilters.allergenFree.push(allergen);
    }
    this.searchByNutrition();
  }

  toggleDietaryFilter(tag: string) {
    const index = this.selectedFilters.dietaryTags.indexOf(tag);
    if (index >= 0) {
      this.selectedFilters.dietaryTags.splice(index, 1);
    } else {
      this.selectedFilters.dietaryTags.push(tag);
    }
    this.searchByNutrition();
  }

  getCalorieColor(calories: number): string {
    if (calories < 200) return 'success';
    if (calories < 400) return 'warning';
    return 'danger';
  }

  getProteinColor(protein: number): string {
    if (protein > 20) return 'success';
    if (protein > 10) return 'warning';
    return 'medium';
  }

  getSpiceLevelColor(level: string): string {
    switch (level) {
      case 'mild': return 'success';
      case 'medium': return 'warning';
      case 'spicy': return 'danger';
      case 'very_spicy': return 'dark';
      default: return 'medium';
    }
  }
}
