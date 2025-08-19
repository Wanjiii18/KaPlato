import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnhancedNutritionService } from '../services/enhanced-nutrition.service';
import { NutritionManagerComponent } from '../components/nutrition-manager.component';

@Component({
  selector: 'app-nutrition-demo',
  templateUrl: './nutrition-demo.page.html',
  styleUrls: ['./nutrition-demo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, NutritionManagerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NutritionDemoPage implements OnInit {

  selectedDemo = 'search';
  searchResults: any[] = [];
  filipinoDishes: string[] = [];
  sampleNutrition: any = null;
  loading = false;

  demoOptions = [
    { value: 'search', label: 'Search Filipino Dishes' },
    { value: 'manager', label: 'Nutrition Manager' },
    { value: 'api', label: 'Spoonacular Integration' }
  ];

  constructor(private nutritionService: EnhancedNutritionService) {}

  async ngOnInit() {
    this.filipinoDishes = this.nutritionService.getAllFilipinoDishes();
    await this.demonstrateNutritionLookup();
  }

  async demonstrateNutritionLookup() {
    this.loading = true;
    try {
      // Demo: Get nutrition for a popular Filipino dish
      const nutrition = await this.nutritionService.getMenuItemNutrition('adobo');
      this.sampleNutrition = nutrition;
    } catch (error) {
      console.error('Error demonstrating nutrition lookup:', error);
    } finally {
      this.loading = false;
    }
  }

  async searchDishByName(dishName: string) {
    this.loading = true;
    try {
      const nutrition = await this.nutritionService.getMenuItemNutrition(dishName);
      if (nutrition) {
        this.searchResults = [nutrition];
      }
    } catch (error) {
      console.error('Error searching dish:', error);
      this.searchResults = [];
    } finally {
      this.loading = false;
    }
  }

  async searchHealthyOptions() {
    this.loading = true;
    try {
      const healthyDishes = this.nutritionService.searchFilipinoDishes({
        maxCalories: 300,
        dietaryTags: ['healthy']
      });
      
      this.searchResults = [];
      for (const dish of healthyDishes) {
        const nutrition = await this.nutritionService.getMenuItemNutrition(dish);
        if (nutrition) {
          this.searchResults.push(nutrition);
        }
      }
    } catch (error) {
      console.error('Error searching healthy options:', error);
    } finally {
      this.loading = false;
    }
  }

  async searchVegetarianOptions() {
    this.loading = true;
    try {
      const vegetarianDishes = this.nutritionService.searchFilipinoDishes({
        dietaryTags: ['vegetarian']
      });
      
      this.searchResults = [];
      for (const dish of vegetarianDishes) {
        const nutrition = await this.nutritionService.getMenuItemNutrition(dish);
        if (nutrition) {
          this.searchResults.push(nutrition);
        }
      }
    } catch (error) {
      console.error('Error searching vegetarian options:', error);
    } finally {
      this.loading = false;
    }
  }

  getCalorieColor(calories: number): string {
    if (calories < 200) return 'success';
    if (calories < 400) return 'warning';
    return 'danger';
  }

  getSpiceLevelIcon(level: string): string {
    switch (level) {
      case 'mild': return 'leaf';
      case 'medium': return 'flame';
      case 'spicy': return 'flame';
      case 'very_spicy': return 'flame';
      default: return 'help';
    }
  }
}
