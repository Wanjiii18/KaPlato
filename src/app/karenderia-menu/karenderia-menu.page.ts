import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../services/menu.service';
import { OrderService } from '../services/order.service';
import { SpoonacularService } from '../services/spoonacular.service';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { AuthService } from '../services/auth.service';
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
  isEditingItem = false;
  editingItem: MenuItem | null = null;
  
  private menuSubscription?: Subscription;
  
  // New menu item form with all required fields
  newMenuItem = {
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    category: 'main',
    preparation_time_minutes: 15,
    calories: 0,
    ingredients: [] as string[],
    allergens: [] as string[],
    dietary_info: '',
    spice_level: 1,
    serving_size: 1,
    is_available: true,
    is_featured: false,
    image_url: ''
  };

  // Form helpers
  newIngredient = '';
  newAllergen = '';
  availableAllergens = [
    'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 
    'Wheat', 'Soy', 'Sesame', 'Gluten', 'Corn', 'Sulphites'
  ];
  
  categories = [
    { value: 'main', label: 'Main Course' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'beverage', label: 'Beverage' },
  ];

  spiceLevels = [
    { value: 1, label: 'Mild' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Spicy' },
    { value: 4, label: 'Very Spicy' },
    { value: 5, label: 'Extremely Spicy' }
  ];

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
    private orderService: OrderService,
    private spoonacularService: SpoonacularService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private karenderiaInfoService: KarenderiaInfoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    // Check authentication status
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (isAuthenticated) {
      const currentUser = this.authService.getCurrentUser();
      
      // Force reload karenderia data if user is a karenderia owner
      if (currentUser?.role === 'karenderia_owner') {
        this.karenderiaInfoService.reloadKarenderiaData();
        
        // Force reload menu data to ensure fresh data for this user
        await this.menuService.forceReload();
      }
    }
    
    // Always set up the subscription to menu items
    this.loadMenuItems();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  /**
   * Open the order modal for placing orders
   */
  async openOrderModal() {
    try {
      const result = await this.orderService.openOrderModal();
      
      if (result && result.success) {
        const toast = await this.toastController.create({
          message: `Order ${result.orderData.orderNumber || 'placed'} successfully!`,
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        
        // Optionally refresh menu items to update availability
        this.loadMenuItems();
      }
    } catch (error) {
      console.error('Error opening order modal:', error);
      const toast = await this.toastController.create({
        message: 'Failed to open order modal',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
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
      // Remove any potential duplicates based on ID and name
      const uniqueItems = items.filter((item, index, self) => {
        return index === self.findIndex(i => 
          (i.id && item.id && i.id === item.id) || 
          (i.name === item.name && !i.id && !item.id)
        );
      });
      
      this.menuItems = uniqueItems;
      this.filterByCategory();
    });
  }

  filterByCategory(category?: string) {
    if (category) {
      this.selectedCategory = category;
    }
    
    if (this.selectedCategory === 'all') {
      this.filteredMenuItems = this.menuItems;
    } else {
      this.filteredMenuItems = this.menuItems.filter(item => 
        item.category === this.selectedCategory
      );
    }
  }

  startAddingItem() {
    this.isAddingItem = true;
    this.resetNewItemForm();
  }

  cancelAddingItem() {
    this.isAddingItem = false;
    this.isEditingItem = false;
    this.editingItem = null;
    this.resetNewItemForm();
    this.cdr.detectChanges();
  }

  resetNewItemForm() {
    this.newMenuItem = {
      name: '',
      description: '',
      price: 0,
      cost_price: 0,
      category: 'main',
      preparation_time_minutes: 15,
      calories: 0,
      ingredients: [],
      allergens: [],
      dietary_info: '',
      spice_level: 1,
      serving_size: 1,
      is_available: true,
      is_featured: false,
      image_url: ''
    };
    this.newIngredient = '';
    this.newAllergen = '';
    this.showIngredientSelection = false;
  }

  // New ingredient management methods
  addIngredient() {
    if (this.newIngredient.trim() && !this.newMenuItem.ingredients.includes(this.newIngredient.trim())) {
      this.newMenuItem.ingredients.push(this.newIngredient.trim());
      this.newIngredient = '';
    }
  }

  removeIngredient(index: number) {
    this.newMenuItem.ingredients.splice(index, 1);
  }

  // New allergen management methods
  addAllergen() {
    if (this.newAllergen && !this.newMenuItem.allergens.includes(this.newAllergen)) {
      this.newMenuItem.allergens.push(this.newAllergen);
      this.newAllergen = '';
    }
  }

  removeAllergen(index: number) {
    this.newMenuItem.allergens.splice(index, 1);
  }

  toggleAllergen(allergen: string) {
    const index = this.newMenuItem.allergens.indexOf(allergen);
    if (index > -1) {
      this.newMenuItem.allergens.splice(index, 1);
    } else {
      this.newMenuItem.allergens.push(allergen);
    }
  }

  isAllergenSelected(allergen: string): boolean {
    return this.newMenuItem.allergens.includes(allergen);
  }

  onDishTypeChange() {
    if (this.selectedDishType && this.commonIngredients[this.selectedDishType]) {
      this.showIngredientSelection = true;
      // Pre-select common ingredients
      this.newMenuItem.ingredients = this.commonIngredients[this.selectedDishType].map((ing: any) => ing.name);
    } else {
      this.showIngredientSelection = false;
      this.newMenuItem.ingredients = [];
    }
  }

  toggleIngredient(ingredient: any, checked: boolean) {
    if (checked) {
      // Add ingredient if not already in the list
      if (!this.newMenuItem.ingredients.includes(ingredient.name)) {
        this.newMenuItem.ingredients.push(ingredient.name);
      }
    } else {
      // Remove ingredient
      this.newMenuItem.ingredients = this.newMenuItem.ingredients.filter(
        ing => ing !== ingredient.name
      );
    }
  }

  isIngredientSelected(ingredientName: string): boolean {
    return this.newMenuItem.ingredients.includes(ingredientName);
  }

  async addCustomIngredient() {
    const alert = await this.alertController.create({
      header: 'Add Custom Ingredient',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ingredient name'
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
            if (data.name) {
              if (!this.newMenuItem.ingredients.includes(data.name)) {
                this.newMenuItem.ingredients.push(data.name);
              }
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  async saveMenuItem() {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      const toast = await this.toastController.create({
        message: 'You must be logged in to save menu items',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/login']);
      return;
    }

    if (!this.newMenuItem.name || !this.newMenuItem.description || this.newMenuItem.price <= 0) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const menuItem: any = {
      name: this.newMenuItem.name,
      description: this.newMenuItem.description,
      price: this.newMenuItem.price,
      category: this.newMenuItem.category,
      preparation_time: this.newMenuItem.preparation_time_minutes,
      ingredients: this.newMenuItem.ingredients, // Send as simple string array
      allergens: this.newMenuItem.allergens,
      calories: this.newMenuItem.calories,
      dietary_info: this.newMenuItem.dietary_info,
      spice_level: this.newMenuItem.spice_level,
      serving_size: this.newMenuItem.serving_size,
      is_available: this.newMenuItem.is_available,
      is_featured: this.newMenuItem.is_featured,
      image_url: this.newMenuItem.image_url,
      cost_price: this.newMenuItem.cost_price
    };

    try {
      console.log('User authenticated:', this.authService.isAuthenticated());
      console.log('Current user:', this.authService.getCurrentUser());
      
      if (this.isEditingItem && this.editingItem) {
        console.log('Updating menu item:', this.editingItem.id, menuItem);
        await this.menuService.updateMenuItem(this.editingItem.id, menuItem);
        
        const toast = await this.toastController.create({
          message: 'Menu item updated successfully!',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      } else {
        console.log('Adding new menu item:', menuItem);
        await this.menuService.addMenuItem(menuItem);
        
        const toast = await this.toastController.create({
          message: 'Menu item added successfully!',
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      }
      
      this.cancelAddingItem();
      this.loadMenuItems(); // Reload menu items
    } catch (error) {
      console.error('Error saving menu item:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      const toast = await this.toastController.create({
        message: `Failed to ${this.isEditingItem ? 'update' : 'add'} menu item: ` + (error as any)?.message || 'Unknown error',
        duration: 5000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private generateTempId(): string {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async editMenuItem(item: MenuItem) {
    console.log('🔧 EDITING ORIGINAL ITEM:', JSON.stringify(item, null, 2));
    console.log('🔧 EDITING item.name:', item.name, 'typeof:', typeof item.name);
    console.log('🔧 EDITING item.price:', item.price, 'typeof:', typeof item.price);
    console.log('🔧 EDITING item.category:', item.category, 'typeof:', typeof item.category);
    
    // Set edit mode
    this.isEditingItem = true;
    this.isAddingItem = false;
    this.editingItem = item;
    
    // Handle ingredients mapping more robustly
    let ingredientsList: string[] = [];
    if (item.ingredients && Array.isArray(item.ingredients)) {
      ingredientsList = item.ingredients.map((ing: any) => {
        // Handle different ingredient data structures
        if (typeof ing === 'string') {
          return ing;
        } else if (ing.ingredientName) {
          return ing.ingredientName;
        } else if (ing.name) {
          return ing.name;
        } else {
          return String(ing);
        }
      });
    }
    
    // Convert price to number, handling string format
    const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    // Use any to access backend properties that might not be in interface
    const itemAny = item as any;
    const prepTimeValue = itemAny.preparation_time_minutes ? Number(itemAny.preparation_time_minutes) : 15;
    
    // Map backend category to frontend category options
    let frontendCategory = item.category;
    const categoryMap: { [key: string]: string } = {
      'main_course': 'main',
      'main_dish': 'main',
      'appetizer': 'appetizers',
      'dessert': 'desserts', 
      'beverage': 'beverages',
      'rice_dishes': 'main',
      'noodle_dishes': 'main'
    };
    if (categoryMap[item.category]) {
      frontendCategory = categoryMap[item.category];
    }
    
    console.log('🔧 Converted values - price:', priceValue, 'prepTime:', prepTimeValue, 'category:', frontendCategory);
    
    // Directly assign without setTimeout to avoid timing issues
    this.newMenuItem = {
      name: String(item.name || ''),
      description: String(item.description || ''),
      price: priceValue || 0,
      cost_price: 0,
      category: frontendCategory,
      preparation_time_minutes: prepTimeValue,
      calories: itemAny.calories || 0,
      ingredients: ingredientsList,
      allergens: [...(item.allergens || [])],
      dietary_info: '',
      spice_level: 1,
      serving_size: 1,
      is_available: itemAny.is_available !== false,
      is_featured: itemAny.is_featured || false,
      image_url: itemAny.image_url || ''
    };
    
    console.log('🔧 Final newMenuItem:', JSON.stringify(this.newMenuItem, null, 2));
    console.log('🔧 newMenuItem.name after assignment:', this.newMenuItem.name);
    console.log('🔧 newMenuItem.price after assignment:', this.newMenuItem.price);
    console.log('🔧 newMenuItem.category after assignment:', this.newMenuItem.category);
    
    // Force change detection multiple times to ensure binding works
    this.cdr.detectChanges();
    
    // Additional force update with timeout and manual DOM update
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('🔧 After timeout - newMenuItem.name:', this.newMenuItem.name);
      
      // Manually trigger DOM updates for Ionic components
      const nameInput = document.querySelector('ion-input[label="Dish Name *"] input') as HTMLInputElement;
      const descTextarea = document.querySelector('ion-textarea[label="Description *"] textarea') as HTMLTextAreaElement;
      const priceInput = document.querySelector('ion-input[label="Price (PHP) *"] input') as HTMLInputElement;
      
      if (nameInput) {
        nameInput.value = this.newMenuItem.name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('🔧 Manually set name input to:', nameInput.value);
      }
      
      if (descTextarea) {
        descTextarea.value = this.newMenuItem.description;
        descTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('🔧 Manually set description to:', descTextarea.value);
      }
      
      if (priceInput) {
        priceInput.value = this.newMenuItem.price.toString();
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('🔧 Manually set price to:', priceInput.value);
      }
    }, 100);
    
    // Additional force refresh after longer delay
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 200);
    
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('.modern-add-item-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Method to get user-friendly category display name
  getCategoryDisplayName(category: string): string {
    const categoryDisplayMap: { [key: string]: string } = {
      'main_course': 'Main Course',
      'main': 'Main Course',
      'appetizer': 'Appetizer',
      'appetizers': 'Appetizers',
      'dessert': 'Dessert',
      'desserts': 'Desserts',
      'beverage': 'Beverage',
      'beverages': 'Beverages',
      'soup': 'Soup',
      'rice': 'Rice Dishes',
      'rice_dishes': 'Rice Dishes',
      'noodle': 'Noodle Dishes',
      'noodle_dishes': 'Noodle Dishes',
      'snack': 'Snack',
      'snacks': 'Snacks'
    };
    
    return categoryDisplayMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
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

  navigateToPos() {
    this.router.navigate(['/karenderia-orders-pos']);
  }

  navigateToOrders() {
    this.router.navigate(['/karenderia-orders']);
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
