import { Component, OnInit } from '@angular/core';
import { MenuService } from '../services/menu.service';
import { AnalyticsService } from '../services/analytics.service';
import { MenuItem, DetailedOrder, DetailedOrderItem } from '../models/menu.model';
import { AlertController, ToastController } from '@ionic/angular';

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface PosOrder {
  id?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'gcash';
  customerName?: string;
  orderType: 'dine-in' | 'takeout';
  status: 'pending' | 'completed';
  createdAt: Date;
}

@Component({
  selector: 'app-karenderia-orders-pos',
  templateUrl: './karenderia-orders-pos.page.html',
  styleUrls: ['./karenderia-orders-pos.page.scss'],
  standalone: false
})
export class KarenderiaOrdersPosPage implements OnInit {
    
  // Categories
  categories = [
    { id: 'rice-bowl', name: 'Rice Bowl', icon: 'restaurant' },
    { id: 'noodles', name: 'Noodles', icon: 'cafe' },
    { id: 'grilled', name: 'Grilled', icon: 'flame' },
    { id: 'fried', name: 'Fried', icon: 'pizza' },
    { id: 'soup', name: 'Soup', icon: 'wine' },
    { id: 'dessert', name: 'Dessert', icon: 'ice-cream' },
    { id: 'beverages', name: 'Beverages', icon: 'cafe' }
  ];

  selectedCategory = 'rice-bowl';
  
  // Menu items (mock data based on the image)
  menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Thai Rice Bowl',
      description: 'Authentic Thai flavors with rice',
      price: 279.09,
      category: 'rice-bowl',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 15,
      isAvailable: true,
      isPopular: true,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Smoke Salmon Rice Bowl',
      description: 'Fresh salmon with rice and vegetables',
      price: 327.09,
      category: 'rice-bowl',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 12,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Healthy Rice Bowl',
      description: 'Nutritious and balanced rice bowl',
      price: 327.09,
      category: 'rice-bowl',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 10,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Bibimbap Rice Bowl',
      description: 'Korean style mixed rice bowl',
      price: 327.09,
      category: 'rice-bowl',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 18,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'Golden Beef Rice Bowl',
      description: 'Tender beef with golden sauce',
      price: 327.09,
      category: 'rice-bowl',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 20,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Add more items for other categories
    {
      id: '6',
      name: 'Miso Ramen',
      description: 'Rich and flavorful miso broth ramen',
      price: 279.09,
      category: 'noodles',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 15,
      isAvailable: true,
      isPopular: true,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      name: 'Waffle',
      description: 'Crispy waffle with toppings',
      price: 179.09,
      category: 'dessert',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 8,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '8',
      name: 'Mocha Ice Cream',
      description: 'Rich mocha flavored ice cream',
      price: 179.09,
      category: 'dessert',
      image: 'assets/default-food.svg',
      ingredients: [],
      preparationTime: 5,
      isAvailable: true,
      isPopular: false,
      allergens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Current order
  currentOrder: OrderItem[] = [];
  paymentMethod: 'cash' | 'card' | 'gcash' = 'cash';
  customerName = '';
  orderType: 'dine-in' | 'takeout' = 'dine-in';

  // Enhanced order properties
  currentDetailedOrder: Partial<DetailedOrder> = {
    customerName: '',
    customerPhone: '',
    orderType: 'dine-in',
    paymentMethod: 'cash',
    notes: ''
  };

  // Analytics data
  todaysAnalytics: any = null;
  seasonalTrends: any = null;

  constructor(
    private menuService: MenuService,
    private analyticsService: AnalyticsService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadMenuItems();
    this.loadTodaysAnalytics();
    this.loadSeasonalTrends();
  }

  loadMenuItems() {
    // In a real app, load from MenuService
    // For now, using mock data
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  getFilteredMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  addToOrder(menuItem: MenuItem) {
    const existingItem = this.currentOrder.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.subtotal = existingItem.quantity * menuItem.price;
    } else {
      this.currentOrder.push({
        menuItem,
        quantity: 1,
        subtotal: menuItem.price
      });
    }
  }

  removeFromOrder(index: number) {
    this.currentOrder.splice(index, 1);
  }

  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromOrder(index);
    } else {
      this.currentOrder[index].quantity = newQuantity;
      this.currentOrder[index].subtotal = newQuantity * this.currentOrder[index].menuItem.price;
    }
  }

  getOrderTotal(): number {
    return this.currentOrder.reduce((total, item) => total + item.subtotal, 0);
  }

  async loadTodaysAnalytics() {
    try {
      // Use karenderia ID 1 from seeded data
      this.todaysAnalytics = await this.analyticsService.getSalesAnalytics('1', 'daily');
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async loadSeasonalTrends() {
    try {
      const currentSeason = this.getCurrentSeason();
      this.seasonalTrends = await this.analyticsService.getPopularItemsBySeason('1', currentSeason);
    } catch (error) {
      console.error('Error loading seasonal trends:', error);
    }
  }

  getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return month === 12 ? 'christmas' : 'dry';
    if (month >= 3 && month <= 5) return 'summer';
    return 'wet';
  }

  // Enhanced process order with detailed analytics
  async processOrder() {
    if (this.currentOrder.length === 0) {
      const toast = await this.toastController.create({
        message: 'Please add items to the order',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    try {
      // Calculate totals and analytics
      const subtotal = this.getOrderTotal();
      const tax = 0; // Adjust based on local tax requirements
      const discount = 0; // Apply discounts if any
      const totalAmount = subtotal + tax - discount;

      // Create detailed order items with cost analysis
      const detailedItems: DetailedOrderItem[] = this.currentOrder.map(orderItem => {
        const ingredientCost = this.calculateIngredientCost(orderItem.menuItem);
        const profitMargin = orderItem.subtotal - (ingredientCost * orderItem.quantity);

        return {
          menuItemId: orderItem.menuItem.id,
          menuItemName: orderItem.menuItem.name,
          quantity: orderItem.quantity,
          unitPrice: orderItem.menuItem.price,
          subtotal: orderItem.subtotal,
          ingredientCost: ingredientCost * orderItem.quantity,
          profitMargin,
          preparationTime: orderItem.menuItem.preparationTime,
          specialInstructions: '', // Could be added from UI
          modifications: [] // Could be added from UI
        };
      });

      // Create detailed order
      const detailedOrder: Omit<DetailedOrder, 'id' | 'orderNumber' | 'placedAt' | 'seasonalData'> = {
        karenderiaId: '1', // Use karenderia ID 1 from seeded data
        items: detailedItems,
        customerName: this.customerName,
        customerPhone: this.currentDetailedOrder.customerPhone,
        orderType: this.orderType,
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentMethod: this.paymentMethod,
        orderStatus: 'pending',
        notes: this.currentDetailedOrder.notes
      };

      // Save to database with analytics
      const orderId = await this.analyticsService.createDetailedOrder(detailedOrder);

      // Show success message with business insights
      await this.showOrderSuccessWithInsights(orderId, detailedOrder);

      // Clear current order
      this.clearOrder();
      
      // Reload analytics
      await this.loadTodaysAnalytics();

    } catch (error) {
      console.error('Error processing order:', error);
      const toast = await this.toastController.create({
        message: 'Failed to process order. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  calculateIngredientCost(menuItem: MenuItem): number {
    return menuItem.ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  }

  async showOrderSuccessWithInsights(orderId: string, order: any) {
    const profitMargin = order.items.reduce((total: number, item: any) => total + item.profitMargin, 0);
    const profitPercentage = ((profitMargin / order.totalAmount) * 100).toFixed(1);

    const alert = await this.alertController.create({
      header: 'Order Completed Successfully!',
      message: `
        <div style="text-align: left;">
          <p><strong>Order Total:</strong> ${this.formatPhp(order.totalAmount)}</p>
          <p><strong>Profit:</strong> ${this.formatPhp(profitMargin)} (${profitPercentage}%)</p>
          <p><strong>Season:</strong> ${this.getCurrentSeason().charAt(0).toUpperCase() + this.getCurrentSeason().slice(1)}</p>
          <br>
          <p><strong>📊 Business Insight:</strong></p>
          <p>${this.getOrderInsight(order)}</p>
        </div>
      `,
      buttons: [
        {
          text: 'View Analytics',
          handler: () => {
            this.showDetailedAnalytics();
          }
        },
        {
          text: 'New Order',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  getOrderInsight(order: any): string {
    const currentSeason = this.getCurrentSeason();
    const insights = this.analyticsService.getSeasonalRecommendations(currentSeason);
    
    // Analyze the current order
    const mostExpensiveItem = order.items.reduce((prev: any, current: any) => 
      prev.unitPrice > current.unitPrice ? prev : current
    );

    return `During ${currentSeason} season, ${mostExpensiveItem.menuItemName} is performing well. ${insights[0]}`;
  }

  async showDetailedAnalytics() {
    const alert = await this.alertController.create({
      header: '📈 Today\'s Business Analytics',
      message: `
        <div style="text-align: left;">
          ${this.todaysAnalytics ? `
            <p><strong>Total Sales:</strong> ${this.formatPhp(this.todaysAnalytics.totalSales)}</p>
            <p><strong>Orders:</strong> ${this.todaysAnalytics.totalOrders}</p>
            <p><strong>Average Order:</strong> ${this.formatPhp(this.todaysAnalytics.averageOrderValue)}</p>
            <p><strong>Profit:</strong> ${this.formatPhp(this.todaysAnalytics.totalProfit)}</p>
            <br>
            <p><strong>🏆 Top Item Today:</strong></p>
            <p>${this.todaysAnalytics.topSellingItems[0]?.menuItemName || 'No data yet'}</p>
          ` : '<p>No analytics data available yet.</p>'}
        </div>
      `,
      buttons: ['Close']
    });

    await alert.present();
  }

  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  clearOrder() {
    this.currentOrder = [];
  }

  async showOrderHistory() {
    // Navigate to order history page
    console.log('Show order history');
  }

  setPaymentMethod(method: 'cash' | 'card' | 'gcash') {
    this.paymentMethod = method;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/default-food.svg';
  }

  getSelectedCategoryName(): string {
    const category = this.categories.find(c => c.id === this.selectedCategory);
    return category ? category.name : '';
  }

  // Add missing methods
  showSettings() {
    console.log('Show settings');
  }

  getCategoryItemCount(categoryId: string): number {
    return this.menuItems.filter(item => item.category === categoryId).length;
  }

  searchItems() {
    console.log('Search items');
  }
}
