import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { Allergen, MealPlan } from './auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private firestore: Firestore,
    private userService: UserService
  ) {}

  // Allergen Management
  async addAllergen(uid: string, allergen: Omit<Allergen, 'id' | 'addedAt'>): Promise<void> {
    try {
      const newAllergen: Allergen = {
        ...allergen,
        id: this.generateId(),
        addedAt: new Date()
      };

      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        allergens: arrayUnion(newAllergen)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error adding allergen:', error);
      throw error;
    }
  }

  async removeAllergen(uid: string, allergen: Allergen): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        allergens: arrayRemove(allergen)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error removing allergen:', error);
      throw error;
    }
  }

  async updateAllergen(uid: string, oldAllergen: Allergen, updatedAllergen: Allergen): Promise<void> {
    try {
      // Remove old and add updated
      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        allergens: arrayRemove(oldAllergen)
      });
      
      await updateDoc(userDoc, {
        allergens: arrayUnion(updatedAllergen)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error updating allergen:', error);
      throw error;
    }
  }

  // Meal Plan Management
  async addMealPlan(uid: string, mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const newMealPlan: MealPlan = {
        ...mealPlan,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        mealPlans: arrayUnion(newMealPlan)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error adding meal plan:', error);
      throw error;
    }
  }

  async removeMealPlan(uid: string, mealPlan: MealPlan): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        mealPlans: arrayRemove(mealPlan)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error removing meal plan:', error);
      throw error;
    }
  }

  async updateMealPlan(uid: string, oldMealPlan: MealPlan, updatedMealPlan: MealPlan): Promise<void> {
    try {
      updatedMealPlan.updatedAt = new Date();
      
      // Remove old and add updated
      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        mealPlans: arrayRemove(oldMealPlan)
      });
      
      await updateDoc(userDoc, {
        mealPlans: arrayUnion(updatedMealPlan)
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw error;
    }
  }

  async setActiveMealPlan(uid: string, mealPlanId: string): Promise<void> {
    try {
      const userProfile = this.userService.getCurrentUserProfile();
      if (!userProfile?.mealPlans) return;

      // Update all meal plans to set only the selected one as active
      const updatedMealPlans = userProfile.mealPlans.map(plan => ({
        ...plan,
        isActive: plan.id === mealPlanId,
        updatedAt: new Date()
      }));

      const userDoc = doc(this.firestore, 'users', uid);
      await updateDoc(userDoc, {
        mealPlans: updatedMealPlans
      });

      // Refresh user profile
      await this.userService.loadUserProfile(uid);
    } catch (error) {
      console.error('Error setting active meal plan:', error);
      throw error;
    }
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get predefined allergens list
  getPredefinedAllergens(): string[] {
    return [
      'Milk/Dairy',
      'Eggs',
      'Fish',
      'Shellfish',
      'Tree Nuts',
      'Peanuts',
      'Wheat/Gluten',
      'Soybeans',
      'Sesame',
      'Corn',
      'Sulfites',
      'MSG',
      'Food Coloring',
      'Chocolate',
      'Tomatoes',
      'Citrus Fruits',
      'Strawberries',
      'Coconut',
      'Pork',
      'Beef',
      'Chicken'
    ];
  }

  // Get dietary restrictions options
  getDietaryRestrictions(): string[] {
    return [
      'Vegetarian',
      'Vegan',
      'Halal',
      'Kosher',
      'Gluten-Free',
      'Dairy-Free',
      'Low-Sodium',
      'Low-Fat',
      'Low-Carb',
      'Keto',
      'Paleo',
      'Diabetic-Friendly',
      'Heart-Healthy'
    ];
  }

  // Get cuisine preferences
  getCuisinePreferences(): string[] {
    return [
      'Filipino',
      'Chinese',
      'Japanese',
      'Korean',
      'Thai',
      'Vietnamese',
      'Indian',
      'Italian',
      'Mexican',
      'American',
      'Mediterranean',
      'Middle Eastern'
    ];
  }
}
