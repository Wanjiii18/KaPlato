import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DailyMenuService } from '../services/daily-menu.service';

interface KarenderiaMenuItem {
  id: number;
  menu_item: any;
  quantity: number;
  special_price?: number;
  notes?: string;
}

interface AvailableKarenderia {
  karenderia: any;
  menu_items: KarenderiaMenuItem[];
}

@Component({
  selector: 'app-meal-planner',
  templateUrl: './meal-planner.page.html',
  styleUrls: ['./meal-planner.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule]
})
export class MealPlannerPage implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' = 'breakfast';

  availableMenuItems: any[] = []; // Flattened menu items for easy selection
  selectedMenuItemIds: Set<number> = new Set(); // Track selected menu item IDs
  availableKarenderias: any[] = [];

  isLoading = false;
  minDate = new Date().toISOString();
  
  mealTypes = [
    { value: 'breakfast' as const, label: 'Breakfast', icon: 'sunny', color: '#FFB74D' },
    { value: 'lunch' as const, label: 'Lunch', icon: 'restaurant', color: '#4CAF50' },
    { value: 'dinner' as const, label: 'Dinner', icon: 'moon', color: '#673AB7' }
  ];

  constructor(
    private dailyMenuService: DailyMenuService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthentication();
    this.loadAvailableKarenderias();
  }

  private checkAuthentication() {
    const token = sessionStorage.getItem('auth_token');
    console.log('Auth token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    
    if (!token) {
      console.error('No authentication token found');
      this.showToast('Please log in to access meal planning', 'danger');
    }
  }

  async loadAvailableKarenderias() {
    this.isLoading = true;
    console.log('Loading available karenderias for:', this.selectedDate, this.selectedMealType);
    
    try {
      const response = await this.dailyMenuService.getAvailableForCustomers(
        this.selectedDate, 
        this.selectedMealType
      ).toPromise();

      console.log('Response received:', response);

      // Flatten all menu items for easy selection
      this.availableMenuItems = (response.data || []).flatMap((k: AvailableKarenderia) =>
        k.menu_items.map(mi => ({
          ...mi,
          karenderia: k.karenderia
        }))
      );

      console.log('Available menu items:', this.availableMenuItems.length);

      if (this.availableMenuItems.length === 0) {
        this.showToast('No menu items available for this meal type and date', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading available karenderias:', error);
      console.error('Error status:', error.status);
      console.error('Error response:', error.error);
      
      if (error.status === 401) {
        this.showToast('Authentication failed. Please log in again.', 'danger');
      } else if (error.status === 0) {
        this.showToast('Unable to connect to server. Please check your internet connection.', 'danger');
      } else if (error.status === 500) {
        const errorMsg = error.error?.message || 'Server error occurred';
        this.showToast(`Server error: ${errorMsg}`, 'danger');
        console.error('Server error details:', error.error);
      } else {
        this.showToast('Error loading available options. Please try again.', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  onDateChange() {
    this.loadAvailableKarenderias();
  }

  onMealTypeChange() {
    this.loadAvailableKarenderias();
  }

  toggleMenuItemSelection(menuItemId: number) {
    if (this.selectedMenuItemIds.has(menuItemId)) {
      this.selectedMenuItemIds.delete(menuItemId);
    } else {
      this.selectedMenuItemIds.add(menuItemId);
    }
  }

  getSelectedItemsForCurrentMeal() {
    return this.availableMenuItems.filter(item => this.selectedMenuItemIds.has(item.id));
  }

  removeFromMealPlan(index: number) {
    const items = this.getSelectedItemsForCurrentMeal();
    
    if (index >= 0 && index < items.length) {
      const item = items[index];
      this.selectedMenuItemIds.delete(item.id);
      this.showToast('Item removed from meal plan', 'success');
    }
  }

  getTotalPrice(): number {
    const items = this.getSelectedItemsForCurrentMeal();
    return items.reduce((total, item) => {
      const price = item.special_price || item.menu_item.price;
      return total + (price * item.quantity);
    }, 0);
  }

  async saveMealPlan() {
    const allSelectedItems = this.getSelectedItemsForCurrentMeal();
    
    if (allSelectedItems.length === 0) {
      this.showToast('Please select at least one meal item', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving your meal plan...'
    });
    await loading.present();

    try {
      // Here you would typically save to your backend
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      await loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Meal Plan Saved!',
        message: `Your meal plan with ${allSelectedItems.length} items has been saved successfully.`,
        buttons: [
          {
            text: 'View Full Plan',
            handler: () => {
              // Navigate to full meal plan view
            }
          },
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      
      await alert.present();
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error saving meal plan:', error);
      this.showToast('Error saving meal plan', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }

  getPrice(menuItem: KarenderiaMenuItem): number {
    return menuItem.special_price || menuItem.menu_item?.price || 0;
  }

  hasSpecialPrice(menuItem: KarenderiaMenuItem): boolean {
    return menuItem.special_price !== null && menuItem.special_price !== undefined;
  }

  // Helper methods for template
  getCurrentMealTypeLabel(): string {
    return this.mealTypes.find(m => m.value === this.selectedMealType)?.label || '';
  }

  selectMealType(value: string): void {
    this.selectedMealType = value as 'breakfast' | 'lunch' | 'dinner';
    this.onMealTypeChange();
  }

  hasSelectedItems(): boolean {
    return this.selectedMenuItemIds.size > 0;
  }

  async debugDailyMenuService() {
    console.log('=== DEBUG: Testing Daily Menu Service ===');
    console.log('Selected date:', this.selectedDate);
    console.log('Selected meal type:', this.selectedMealType);
    console.log('Auth token:', sessionStorage.getItem('auth_token') ? 'Present' : 'Missing');
    
    try {
      const response = await this.dailyMenuService.getAvailableForCustomers(
        this.selectedDate, 
        this.selectedMealType
      ).toPromise();
      console.log('Success response:', response);
    } catch (error) {
      console.error('Debug error:', error);
    }
  }
}