import { Component, OnInit } from '@angular/core';
import { MenuService } from '../services/menu.service';
import { MenuItem, MenuIngredient } from '../models/menu.model';
import { AlertController, ToastController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-karenderia-menu',
  templateUrl: './karenderia-menu.page.html',
  styleUrls: ['./karenderia-menu.page.scss'],
  standalone: false,
})
export class KarenderiaMenuPage implements OnInit {
  menuItems: MenuItem[] = [];
  filteredMenuItems: MenuItem[] = [];
  selectedCategory = 'all';
  isAddingItem = false;
  
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
    private menuService: MenuService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadMenuItems();
  }

  loadMenuItems() {
    this.menuService.menuItems$.subscribe(items => {
      this.menuItems = items;
      this.filterByCategory();
    });
  }

  filterByCategory() {
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

  updateIngredientQuantity(index: number, quantity: string | number | null | undefined) {
    this.newMenuItem.selectedIngredients[index].quantity = parseFloat(quantity?.toString() || '0') || 0;
  }

  updateIngredientCost(index: number, cost: string | number | null | undefined) {
    this.newMenuItem.selectedIngredients[index].cost = parseFloat(cost?.toString() || '0') || 0;
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await this.menuService.addMenuItem(menuItem);
      
      const toast = await this.toastController.create({
        message: 'Menu item added successfully!',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
      
      this.cancelAddingItem();
    } catch (error) {
      console.error('Error adding menu item:', error);
      const toast = await this.toastController.create({
        message: 'Failed to add menu item',
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
    // Implementation for editing menu items
    console.log('Edit menu item:', item);
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

  getDishTypes(): string[] {
    return Object.keys(this.commonIngredients);
  }

  getDishTypeDisplay(dishType: string): string {
    return dishType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}
