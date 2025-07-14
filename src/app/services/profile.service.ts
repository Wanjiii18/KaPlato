import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Allergen, MealPlan } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  // Allergen Management
  async addAllergen(uid: string, allergen: Omit<Allergen, 'id' | 'addedAt'>): Promise<void> {
    try {
      const response = await this.http.post(`${this.apiUrl}/users/${uid}/allergens`, allergen).toPromise();
      console.log('Allergen added:', response);
    } catch (error) {
      console.error('Error adding allergen:', error);
      throw error;
    }
  }

  async removeAllergen(uid: string, allergenId: string): Promise<void> {
    try {
      const response = await this.http.delete(`${this.apiUrl}/users/${uid}/allergens/${allergenId}`).toPromise();
      console.log('Allergen removed:', response);
    } catch (error) {
      console.error('Error removing allergen:', error);
      throw error;
    }
  }

  // Meal Plan Management
  async addMealPlan(uid: string, mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await this.http.post(`${this.apiUrl}/users/${uid}/meal-plans`, mealPlan).toPromise();
      console.log('Meal plan added:', response);
    } catch (error) {
      console.error('Error adding meal plan:', error);
      throw error;
    }
  }

  async removeMealPlan(uid: string, mealPlanId: string): Promise<void> {
    try {
      const response = await this.http.delete(`${this.apiUrl}/users/${uid}/meal-plans/${mealPlanId}`).toPromise();
      console.log('Meal plan removed:', response);
    } catch (error) {
      console.error('Error removing meal plan:', error);
      throw error;
    }
  }

  // Get predefined allergens
  getPredefinedAllergens(): Allergen[] {
    return [
      { id: '1', name: 'Peanuts', category: 'Nuts' },
      { id: '2', name: 'Tree Nuts', category: 'Nuts' },
      { id: '3', name: 'Dairy', category: 'Dairy' },
      { id: '4', name: 'Eggs', category: 'Protein' },
      { id: '5', name: 'Fish', category: 'Seafood' },
      { id: '6', name: 'Shellfish', category: 'Seafood' },
      { id: '7', name: 'Soy', category: 'Legumes' },
      { id: '8', name: 'Wheat', category: 'Grains' },
      { id: '9', name: 'Sesame', category: 'Seeds' },
      { id: '10', name: 'Mustard', category: 'Spices' }
    ];
  }

  // Get dietary restrictions
  getDietaryRestrictions(): string[] {
    return [
      'Vegetarian',
      'Vegan',
      'Gluten-Free',
      'Lactose-Free',
      'Keto',
      'Paleo',
      'Low-Carb',
      'Low-Fat',
      'Diabetic-Friendly',
      'Heart-Healthy',
      'Halal',
      'Kosher'
    ];
  }

  // Get cuisine preferences
  getCuisinePreferences(): string[] {
    return [
      'Filipino',
      'American',
      'Chinese',
      'Japanese',
      'Korean',
      'Italian',
      'Mexican',
      'Thai',
      'Indian',
      'Mediterranean',
      'French',
      'Spanish',
      'Vietnamese',
      'Malaysian',
      'Indonesian'
    ];
  }

  // Set active meal plan
  async setActiveMealPlan(uid: string, mealPlanId: string): Promise<void> {
    try {
      const response = await this.http.put(`${this.apiUrl}/users/${uid}/active-meal-plan`, { 
        mealPlanId: mealPlanId 
      }).toPromise();
      console.log('Active meal plan set:', response);
    } catch (error) {
      console.error('Error setting active meal plan:', error);
      throw error;
    }
  }
}
