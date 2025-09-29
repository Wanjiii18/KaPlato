import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MenuService } from '../services/menu.service';
import { AnalyticsService } from '../services/analytics.service';
import { MenuItem, DetailedOrder, DetailedOrderItem } from '../models/menu.model';
import { AlertController, ToastController } from '@ionic/angular';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { Subscription } from 'rxjs';
import { DailyMenuService, DailyMenuItem } from '../services/daily-menu.service';

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
export class KarenderiaOrdersPosPage implements OnInit, OnDestroy {
    
  // Search term
  searchTerm = '';
  
  // Selected category
  selectedCategory = 'all';
  
  // Table number
  tableNumber = '';
  
  // Current order array for the new template
  currentOrder: any[] = [];
  
  // Categories - Updated to match backend categories
  categories = [
    { id: 'all', name: 'All Items', icon: 'grid' },
    { id: 'Main Dish', name: 'Main Dish', icon: 'restaurant' },
    { id: 'Appetizer', name: 'Appetizer', icon: 'leaf' },
    { id: 'Side Dish', name: 'Side Dish', icon: 'cafe' },
    { id: 'Dessert', name: 'Dessert', icon: 'ice-cream' },
    { id: 'Beverage', name: 'Beverage', icon: 'wine' }
  ];
  
  
  // Daily menu logic from daily-menu-management
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' = 'breakfast';
  mealTypes = [
    { value: 'breakfast' as const, label: 'Breakfast', icon: 'sunny' },
    { value: 'lunch' as const, label: 'Lunch', icon: 'restaurant' },
    { value: 'dinner' as const, label: 'Dinner', icon: 'moon' }
  ];
  dailyMenuItems: DailyMenuItem[] = [];
  isLoadingMenu = false;
  private dailyMenuSubscription?: Subscription;

  // Current order
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
    private toastController: ToastController,
    private karenderiaInfoService: KarenderiaInfoService,
    private cdr: ChangeDetectorRef,
    private dailyMenuService: DailyMenuService // Inject DailyMenuService
  ) { }

  ngOnInit() {
    this.loadDailyMenuItems();
    this.loadTodaysAnalytics();
    this.loadSeasonalTrends();
  }

  async loadDailyMenuItems() {
    this.isLoadingMenu = true;
    try {
      const response = await this.dailyMenuService.getDailyMenu(this.selectedDate, this.selectedMealType).toPromise();
      this.dailyMenuItems = (response.data || []).filter((item: DailyMenuItem) => item.is_available && item.quantity > 0);
      this.isLoadingMenu = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading daily menu items for POS:', error);
      await this.showToast('Failed to load daily menu items');
      this.isLoadingMenu = false;
    }
  }

  ngOnDestroy() {
    if (this.dailyMenuSubscription) {
      this.dailyMenuSubscription.unsubscribe();
    }
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  getFilteredMenuItems(): any[] {
    let filtered = this.dailyMenuItems;
    // Filter by category
    if (this.selectedCategory !== 'all' && this.selectedCategory !== 'All Items') {
      filtered = filtered.filter(item => 
        (item.menu_item?.category) === this.selectedCategory
      );
    }
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.menu_item?.name?.toLowerCase() || '').includes(searchLower) ||
        (item.menu_item?.description?.toLowerCase() || '').includes(searchLower)
      );
    }
    return filtered;
  }

  addToOrder(dailyMenuItem: any) {
    const menuItem = dailyMenuItem.menu_item || dailyMenuItem.menuItem;
    const availableServings = dailyMenuItem.quantity;
    const existingItem = this.currentOrder.find(item => item.menuItem.id === menuItem.id);
    let currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty >= availableServings) {
      this.showToast(`No more servings left for ${menuItem.name}`, 'warning');
      return;
    }
    if (existingItem) {
      // Increment existing item quantity
      const newQuantity = currentQty + 1;
      if (newQuantity > availableServings) {
        this.showToast(`Only ${availableServings} servings available for ${menuItem.name}`, 'warning');
        return;
      }
      existingItem.quantity = newQuantity;
      existingItem.subtotal = newQuantity * menuItem.price;
    } else {
      // Add new item with quantity 1
      this.currentOrder.push({
        menuItem,
        quantity: 1,
        subtotal: menuItem.price,
        maxQuantity: availableServings
      });
    }
    // Force update by creating a new array reference
    this.currentOrder = [...this.currentOrder];
    // Also trigger change detection
    this.cdr.detectChanges();
  }

  removeFromOrder(index: number) {
    this.currentOrder.splice(index, 1);
    // Force update by creating a new array reference
    this.currentOrder = [...this.currentOrder];
    // Trigger change detection to update the UI immediately
    this.cdr.detectChanges();
  }

  updateQuantity(index: number, newQuantity: number) {
    // Ensure quantity is a valid integer
    const quantity = Math.max(0, Math.floor(Number(newQuantity)));
    
    if (quantity <= 0) {
      this.removeFromOrder(index);
    } else {
      this.currentOrder[index].quantity = quantity;
      this.currentOrder[index].subtotal = quantity * this.currentOrder[index].menuItem.price;
      
      // Force update by creating a new array reference
      this.currentOrder = [...this.currentOrder];
    }
    
    // Trigger change detection to update the UI immediately
    this.cdr.detectChanges();
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
    // Trigger change detection to update the UI immediately
    this.cdr.detectChanges();
  }

  async showOrderHistory() {
    // Navigate to order history page
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

  // Add missing methods
  showSettings() {
    // Show settings functionality
  }

  getCategoryItemCount(categoryId: string): number {
    return this.dailyMenuItems.filter(item => 
      (item.menu_item?.category) === categoryId
    ).length;
  }

  searchItems() {
    // Search functionality
  }

  // Additional helper methods
  getSubtotal() {
    return this.currentOrder.reduce((total, item) => total + item.subtotal, 0);
  }

  getVAT() {
    return this.getSubtotal() * 0.12; // 12% VAT
  }

  getTotal() {
    return this.getSubtotal() + this.getVAT();
  }

  increaseQuantity(item: any) {
    item.quantity++;
    item.subtotal = item.quantity * item.menuItem.price;
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      item.subtotal = item.quantity * item.menuItem.price;
    } else {
      this.removeFromOrder(this.currentOrder.indexOf(item));
    }
  }

  processPayment() {
    if (!this.tableNumber) {
      this.showToast('Please enter a table number');
      return;
    }

    if (this.currentOrder.length === 0) {
      this.showToast('Please add items to the order');
      return;
    }

    // Process payment logic here
    this.showToast('Payment processed successfully!', 'success');
    this.clearOrder();
  }

  logout() {
    // Handle logout
  }

  // TrackBy functions for better performance
  trackByMenuItem(index: number, item: MenuItem): any {
    return item.id;
  }

  trackByOrderItem(index: number, item: any): any {
    return item.menuItem.id;
  }

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  onDateChange() {
    this.loadDailyMenuItems();
  }

  onMealTypeChange() {
    this.loadDailyMenuItems();
  }

  selectMealType(value: string): void {
    this.selectedMealType = value as 'breakfast' | 'lunch' | 'dinner';
    this.onMealTypeChange();
  }

  selectToday(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.onDateChange();
  }

  selectTomorrow(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate = tomorrow.toISOString().split('T')[0];
    this.onDateChange();
  }

  goToPreviousDay(): void {
    const currentDate = new Date(this.selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    this.selectedDate = currentDate.toISOString().split('T')[0];
    this.onDateChange();
  }

  goToNextDay(): void {
    const currentDate = new Date(this.selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    this.selectedDate = currentDate.toISOString().split('T')[0];
    this.onDateChange();
  }

  getCurrentMealTypeLabel(): string {
    return this.mealTypes.find(m => m.value === this.selectedMealType)?.label || '';
  }

  getFormattedDate(dateStr?: string): string {
    const date = dateStr ? new Date(dateStr) : new Date(this.selectedDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Helper to get price for a DailyMenuItem
  getMenuItemPrice(dailyMenuItem: DailyMenuItem): number {
    return dailyMenuItem.menu_item?.price ?? 0;
  }

  // Helper to get servings left for a DailyMenuItem
  getMenuItemServingsLeft(dailyMenuItem: DailyMenuItem): number {
    return dailyMenuItem.quantity ?? 0;
  }
}
