import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../services/menu.service';
import { SpoonacularService } from '../services/spoonacular.service';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { DailyMenuService, DailyMenuItem } from '../services/daily-menu.service';
import { MenuItem, MenuIngredient } from '../models/menu.model';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-karenderia-menu',
  templateUrl: './karenderia-menu.page.html',
  styleUrls: ['./karenderia-menu-new.page.scss'],
  standalone: false,
})
export class KarenderiaMenuPage implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  filteredMenuItems: MenuItem[] = [];
  selectedCategory = 'all';
  isAddingItem = false;
  editingItemId: string | null = null; // Track which item is being edited
  
  private menuSubscription?: Subscription;
  todaysDailyMenuItems: DailyMenuItem[] = [];
  private dailyMenuSubscription?: Subscription;
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' = 'breakfast';

  // New menu item form
  newMenuItem = {
    name: '',
    description: '',
    price: 0,
    category: 'main',
    preparationTime: 15,
    selectedIngredients: [] as MenuIngredient[],
    customIngredients: [] as MenuIngredient[]
  };

  // Common ingredients for different dish types
  commonIngredients: { [key: string]: { name: string; quantity: number; unit: string; cost: number; }[] } = {
    'adobo': [
      { name: 'Pork', quantity: 500, unit: 'g', cost: 250 },
      { name: 'Soy Sauce', quantity: 100, unit: 'ml', cost: 15 },
      { name: 'Vinegar', quantity: 50, unit: 'ml', cost: 10 },
      { name: 'Garlic', quantity: 50, unit: 'g', cost: 8 },
      { name: 'Bay Leaves', quantity: 5, unit: 'pieces', cost: 3 },
      { name: 'Black Pepper', quantity: 5, unit: 'g', cost: 2 },
      { name: 'Onion', quantity: 100, unit: 'g', cost: 12 }
    ],
    'humba': [
      { name: 'Pork Belly', quantity: 600, unit: 'g', cost: 300 },
      { name: 'Soy Sauce', quantity: 80, unit: 'ml', cost: 12 },
      { name: 'Brown Sugar', quantity: 50, unit: 'g', cost: 8 },
      { name: 'Garlic', quantity: 40, unit: 'g', cost: 6 },
      { name: 'Onion', quantity: 80, unit: 'g', cost: 10 },
      { name: 'Bay Leaves', quantity: 3, unit: 'pieces', cost: 2 },
      { name: 'Black Beans', quantity: 50, unit: 'g', cost: 15 },
      { name: 'Pineapple', quantity: 100, unit: 'g', cost: 20 }
    ],
    'sisig': [
      { name: 'Pork Belly', quantity: 400, unit: 'g', cost: 200 },
      { name: 'Pork Liver', quantity: 100, unit: 'g', cost: 80 },
      { name: 'Onion', quantity: 100, unit: 'g', cost: 12 },
      { name: 'Chili', quantity: 30, unit: 'g', cost: 8 },
      { name: 'Calamansi', quantity: 50, unit: 'ml', cost: 10 },
      { name: 'Soy Sauce', quantity: 30, unit: 'ml', cost: 5 },
      { name: 'Mayonnaise', quantity: 50, unit: 'g', cost: 15 },
      { name: 'Egg', quantity: 1, unit: 'piece', cost: 12 }
    ],
    'pancit': [
      { name: 'Pancit Noodles', quantity: 200, unit: 'g', cost: 25 },
      { name: 'Pork', quantity: 200, unit: 'g', cost: 100 },
      { name: 'Chicken', quantity: 200, unit: 'g', cost: 80 },
      { name: 'Cabbage', quantity: 150, unit: 'g', cost: 15 },
      { name: 'Carrots', quantity: 100, unit: 'g', cost: 12 },
      { name: 'Soy Sauce', quantity: 60, unit: 'ml', cost: 9 },
      { name: 'Garlic', quantity: 30, unit: 'g', cost: 5 },
      { name: 'Onion', quantity: 80, unit: 'g', cost: 10 }
    ],
    'kare-kare': [
      { name: 'Oxtail', quantity: 500, unit: 'g', cost: 400 },
      { name: 'Peanut Butter', quantity: 100, unit: 'g', cost: 35 },
      { name: 'Eggplant', quantity: 200, unit: 'g', cost: 25 },
      { name: 'String Beans', quantity: 150, unit: 'g', cost: 20 },
      { name: 'Bok Choy', quantity: 200, unit: 'g', cost: 30 },
      { name: 'Shrimp Paste', quantity: 50, unit: 'g', cost: 15 },
      { name: 'Rice Flour', quantity: 50, unit: 'g', cost: 8 },
      { name: 'Onion', quantity: 100, unit: 'g', cost: 12 }
    ],
    'lechon-kawali': [
      { name: 'Pork Belly', quantity: 600, unit: 'g', cost: 300 },
      { name: 'Salt', quantity: 20, unit: 'g', cost: 2 },
      { name: 'Bay Leaves', quantity: 5, unit: 'pieces', cost: 3 },
      { name: 'Peppercorns', quantity: 10, unit: 'g', cost: 5 },
      { name: 'Cooking Oil', quantity: 500, unit: 'ml', cost: 60 }
    ],
    'beef-stew': [
      { name: 'Beef', quantity: 500, unit: 'g', cost: 350 },
      { name: 'Potatoes', quantity: 300, unit: 'g', cost: 30 },
      { name: 'Carrots', quantity: 200, unit: 'g', cost: 24 },
      { name: 'Tomato Sauce', quantity: 200, unit: 'ml', cost: 25 },
      { name: 'Onion', quantity: 150, unit: 'g', cost: 18 },
      { name: 'Garlic', quantity: 50, unit: 'g', cost: 8 },
      { name: 'Bell Pepper', quantity: 100, unit: 'g', cost: 15 }
    ],
    'fried-rice': [
      { name: 'Rice', quantity: 300, unit: 'g', cost: 20 },
      { name: 'Egg', quantity: 2, unit: 'pieces', cost: 24 },
      { name: 'Garlic', quantity: 30, unit: 'g', cost: 5 },
      { name: 'Soy Sauce', quantity: 40, unit: 'ml', cost: 6 },
      { name: 'Green Onions', quantity: 50, unit: 'g', cost: 8 },
      { name: 'Cooking Oil', quantity: 50, unit: 'ml', cost: 6 }
    ]
  };

  selectedDishType = '';
  showIngredientSelection = false;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private spoonacularService: SpoonacularService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private karenderiaInfoService: KarenderiaInfoService,
    private dailyMenuService: DailyMenuService
  ) { }

  ngOnInit() {
    this.loadMenuItems();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
    if (this.dailyMenuSubscription) {
      this.dailyMenuSubscription.unsubscribe();
    }
  }

  loadMenuItems() {
    // Subscribe to menu items from the service
    // The service automatically loads data in its constructor, so we just need to subscribe
    // Unsubscribe any existing subscription first to prevent duplicates
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
    
    this.menuSubscription = this.menuService.menuItems$.subscribe(items => {
      console.log('Menu items received in component:', items);
      
      // Remove any potential duplicates based on ID and name
      const uniqueItems = items.filter((item, index, self) => {
        return index === self.findIndex(i => 
          (i.id && item.id && i.id === item.id) || 
          (i.name === item.name && !i.id && !item.id)
        );
      });
      
      console.log('Unique menu items after deduplication:', uniqueItems);
      this.menuItems = uniqueItems;
      this.filterByCategory();
    });
  }

  filterByCategory(category?: string) {
    if (category) {
      this.selectedCategory = category;
    }
    // Show all menu items, filter only by category
    let filtered = this.menuItems;
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }
    this.filteredMenuItems = filtered;
  }

  startAddingItem() {
    this.isAddingItem = true;
    this.resetNewItemForm();
  }

  cancelAddingItem() {
    this.isAddingItem = false;
    this.editingItemId = null; // Reset editing state
    this.resetNewItemForm();
  }

  resetNewItemForm() {
    this.newMenuItem = {
      name: '',
      description: '',
      price: 0,
      category: 'main',
      preparationTime: 15,
      selectedIngredients: [],
      customIngredients: []
    };
    this.selectedDishType = '';
    this.showIngredientSelection = false;
  }

  onDishTypeChange() {
    if (this.selectedDishType && this.commonIngredients[this.selectedDishType]) {
      this.showIngredientSelection = true;
      // Pre-select common ingredients
      this.newMenuItem.selectedIngredients = this.commonIngredients[this.selectedDishType].map((ing: any) => ({
        ingredientId: this.generateTempId(),
        ingredientName: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        cost: ing.cost
      }));
    } else {
      this.showIngredientSelection = false;
      this.newMenuItem.selectedIngredients = [];
    }
  }

  toggleIngredient(ingredient: any, checked: boolean) {
    if (checked) {
      // Add ingredient if not already selected
      if (!this.newMenuItem.selectedIngredients.find(ing => ing.ingredientName === ingredient.name)) {
        this.newMenuItem.selectedIngredients.push({
          ingredientId: this.generateTempId(),
          ingredientName: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        });
      }
    } else {
      // Remove ingredient
      this.newMenuItem.selectedIngredients = this.newMenuItem.selectedIngredients.filter(
        ing => ing.ingredientName !== ingredient.name
      );
    }
  }

  isIngredientSelected(ingredientName: string): boolean {
    return this.newMenuItem.selectedIngredients.some(ing => ing.ingredientName === ingredientName);
  }

  async addCustomIngredient() {
    const alert = await this.alertController.create({
      header: 'Add Custom Ingredient',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ingredient name'
        },
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantity'
        },
        {
          name: 'unit',
          type: 'text',
          placeholder: 'Unit (g, ml, pieces, etc.)'
        },
        {
          name: 'cost',
          type: 'number',
          placeholder: 'Cost in PHP'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.name && data.quantity && data.unit && data.cost) {
              this.newMenuItem.selectedIngredients.push({
                ingredientId: this.generateTempId(),
                ingredientName: data.name,
                quantity: parseFloat(data.quantity),
                unit: data.unit,
                cost: parseFloat(data.cost)
              });
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  removeIngredient(index: number) {
    this.newMenuItem.selectedIngredients.splice(index, 1);
  }

  updateIngredientQuantity(index: number, quantity: number) {
    this.newMenuItem.selectedIngredients[index].quantity = quantity;
  }

  updateIngredientCost(index: number, cost: number) {
    this.newMenuItem.selectedIngredients[index].cost = cost;
  }

  getTotalCost(): number {
    return this.newMenuItem.selectedIngredients.reduce((total, ing) => total + ing.cost, 0);
  }

  async saveMenuItem() {
    if (!this.newMenuItem.name || !this.newMenuItem.description || this.newMenuItem.price <= 0) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const menuItem: Partial<MenuItem> = {
      name: this.newMenuItem.name,
      description: this.newMenuItem.description,
      price: this.newMenuItem.price,
      category: this.newMenuItem.category,
      preparationTime: this.newMenuItem.preparationTime,
      ingredients: this.newMenuItem.selectedIngredients,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      updatedAt: new Date()
    };

    try {
      if (this.editingItemId) {
        // Update existing item
        await this.menuService.updateMenuItem(this.editingItemId, menuItem);
        
        const toast = await this.toastController.create({
          message: 'Menu item updated successfully!',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      } else {
        // Add new item
        menuItem.createdAt = new Date();
        await this.menuService.addMenuItem(menuItem);
        
        const toast = await this.toastController.create({
          message: 'Menu item added successfully!',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      }
      
      this.cancelAddingItem();
    } catch (error) {
      console.error('Error saving menu item:', error);
      const toast = await this.toastController.create({
        message: this.editingItemId ? 'Failed to update menu item' : 'Failed to add menu item',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private generateTempId(): string {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async editMenuItem(item: MenuItem) {
    // First, show a simple choice: Quick Edit or Advanced Edit
    const choiceAlert = await this.alertController.create({
      header: 'Edit Menu Item',
      message: `How would you like to edit "${item.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Quick Edit',
          handler: () => {
            this.showQuickEditModal(item);
          }
        },
        {
          text: 'Advanced Edit',
          handler: () => {
            this.showAdvancedEditModal(item);
          }
        }
      ]
    });

    await choiceAlert.present();
  }

  async showQuickEditModal(item: MenuItem) {
    const alert = await this.alertController.create({
      header: 'Quick Edit',
      subHeader: `Update basic details for "${item.name}"`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Dish Name',
          value: item.name
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description',
          value: item.description
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Price (₱)',
          value: item.price.toString(),
          min: 0
        },
        {
          name: 'preparationTime',
          type: 'number',
          placeholder: 'Preparation Time (minutes)',
          value: item.preparationTime?.toString() || '15',
          min: 1
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: async (data) => {
            if (!data.name || !data.description || !data.price) {
              const errorToast = await this.toastController.create({
                message: 'Please fill in all required fields',
                duration: 3000,
                color: 'danger'
              });
              await errorToast.present();
              return false;
            }

            try {
              const updates = {
                name: data.name.trim(),
                description: data.description.trim(),
                price: parseFloat(data.price),
                preparationTime: parseInt(data.preparationTime) || 15,
                updatedAt: new Date()
              };

              await this.menuService.updateMenuItem(item.id, updates);
              
              const toast = await this.toastController.create({
                message: 'Menu item updated successfully!',
                duration: 3000,
                color: 'success'
              });
              await toast.present();
              
              this.loadMenuItems();
              return true;
            } catch (error) {
              console.error('Error updating menu item:', error);
              const errorToast = await this.toastController.create({
                message: 'Failed to update menu item. Please try again.',
                duration: 3000,
                color: 'danger'
              });
              await errorToast.present();
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showAdvancedEditModal(item: MenuItem) {
    // Set the current item data to the form
    this.newMenuItem = {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category || 'main',
      preparationTime: item.preparationTime || 15,
      selectedIngredients: item.ingredients ? [...item.ingredients] : [],
      customIngredients: []
    };
    
    // Switch to editing mode
    this.isAddingItem = true;
    this.editingItemId = item.id; // Add this property to track what we're editing
    
    const toast = await this.toastController.create({
      message: 'Now editing menu item. Make changes and click Save to update.',
      duration: 4000,
      color: 'primary'
    });
    await toast.present();
  }

  async deleteMenuItem(item: MenuItem) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${item.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await this.menuService.deleteMenuItem(item.id);
              const toast = await this.toastController.create({
                message: 'Menu item deleted successfully',
                duration: 3000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting menu item:', error);
              const toast = await this.toastController.create({
                message: 'Failed to delete menu item',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleAvailability(item: MenuItem) {
    try {
      await this.menuService.updateMenuItem(item.id, { 
        isAvailable: !item.isAvailable,
        updatedAt: new Date()
      });
      
      const toast = await this.toastController.create({
        message: `${item.name} ${item.isAvailable ? 'disabled' : 'enabled'} successfully`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating menu item:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update menu item',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  formatPhp(amount: number): string {
    return this.menuService.formatPhp(amount);
  }

  // Dashboard Statistics Methods
  getAvailableItemsCount(): number {
    return this.menuItems.filter(item => item.isAvailable).length;
  }

  getAveragePrice(): number {
    if (this.menuItems.length === 0) return 0;
    const total = this.menuItems.reduce((sum, item) => sum + item.price, 0);
    return total / this.menuItems.length;
  }

  getAverageTime(): string {
    if (this.menuItems.length === 0) return '0m';
    const total = this.menuItems.reduce((sum, item) => sum + (item.preparationTime || 0), 0);
    const average = Math.round(total / this.menuItems.length);
    return `${average}m`;
  }

  // Item Cost and Profit Calculations
  getItemCost(item: MenuItem): number {
    if (!item.ingredients || item.ingredients.length === 0) return 0;
    return item.ingredients.reduce((total, ing) => total + (ing.cost || 0), 0);
  }

  getItemProfit(item: MenuItem): number {
    return item.price - this.getItemCost(item);
  }

  // Category Color Coding
  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'appetizers': 'success',
      'main': 'primary',
      'desserts': 'warning',
      'beverages': 'tertiary'
    };
    return colors[category] || 'medium';
  }

  getDishTypes(): string[] {
    return Object.keys(this.commonIngredients);
  }

  getDishTypeDisplay(dishType: string): string {
    return dishType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Helper method to get appropriate image for menu items
  getItemImage(item: MenuItem): string {
    // If item already has an image, use it
    if (item.image && item.image !== 'assets/default-food.png') {
      return item.image;
    }

    // Map dish names to your new images
    const dishName = item.name?.toLowerCase() || '';
    
    if (dishName.includes('adobo') || dishName.includes('chicken adobo')) {
      return 'assets/images/filipino-adobo-chicken-rice.png';
    }
    if (dishName.includes('kare-kare') || dishName.includes('kare kare')) {
      return 'assets/images/filipino-kare-kare.png';
    }
    if (dishName.includes('lechon') || dishName.includes('kawali')) {
      return 'assets/images/filipino-lechon-kawali.png';
    }
    if (dishName.includes('sinigang') || dishName.includes('baboy')) {
      return 'assets/images/filipino-sinigang.png';
    }
    if (dishName.includes('halo-halo') || dishName.includes('dessert')) {
      return 'assets/images/halo-halo-dessert.png';
    }
    if (dishName.includes('garlic rice') || dishName.includes('fried rice')) {
      return 'assets/images/garlic-rice.png';
    }
    if (dishName.includes('rice') && !dishName.includes('fried')) {
      return 'assets/images/plain-white-rice.png';
    }
    if (dishName.includes('tea') || dishName.includes('iced')) {
      return 'assets/images/iced-tea.png';
    }
    
    // Default fallback
    return 'assets/images/placeholder-food.jpg';
  }

  // Navigation methods
  navigateToDashboard() {
    this.router.navigate(['/karenderia-dashboard']);
  }

  navigateToInventory() {
    this.router.navigate(['/inventory-management']);
  }

  navigateToDailyMenu() {
    this.router.navigate(['/daily-menu-management']);
  }

  navigateToAnalytics() {
    this.router.navigate(['/karenderia-analytics']);
  }

  logout() {
    // Clear any stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }
}
