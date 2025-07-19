import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { MenuService } from '../../services/menu.service';
import { AnalyticsService } from '../../services/analytics.service';
import { SpoonacularService, SpoonacularMenuItem } from '../../services/spoonacular.service';
import { MenuItem, DetailedOrder, DetailedOrderItem } from '../../models/menu.model';

interface OrderItem {
  menuItem: MenuItem; // Changed back to local MenuItem
  quantity: number;
  subtotal: number;
  profit: number;
}

@Component({
  selector: 'app-order-modal',
  templateUrl: './order-modal.component.html',
  styleUrls: ['./order-modal.component.scss'],
  standalone: false
})
export class OrderModalComponent implements OnInit {
  availableItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  orderItems: OrderItem[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';
  
  // Order details
  customerName: string = '';
  customerPhone: string = '';
  orderType: 'dine-in' | 'takeout' | 'delivery' = 'dine-in';
  paymentMethod: 'cash' | 'card' | 'gcash' | 'maya' = 'cash';
  tableNumber: string = '';
  notes: string = '';
  
  // Totals
  subtotal: number = 0;
  tax: number = 0;
  discount: number = 0;
  totalAmount: number = 0;
  totalProfit: number = 0;
  
  // UI states
  isLoading: boolean = false;
  activeTab: 'menu' | 'cart' | 'details' = 'menu';
  
  categories: string[] = ['all', 'breakfast', 'main', 'appetizer', 'dessert', 'drinks', 'side'];

  constructor(
    private modalController: ModalController,
    private menuService: MenuService,
    private spoonacularService: SpoonacularService,
    private analyticsService: AnalyticsService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.loadAvailableItems();
  }

  /**
   * Load available menu items from local karenderia menu
   */
  async loadAvailableItems() {
    this.isLoading = true;
    try {
      // Load menu items from the local MenuService
      this.menuService.menuItems$.subscribe(items => {
        this.availableItems = items;
        // Only show items that are available
        this.filteredItems = this.availableItems.filter(item => item.isAvailable);
        this.applyFilters();
        this.isLoading = false;
      });
      
    } catch (error) {
      console.error('Error loading menu items:', error);
      this.showToast('Failed to load menu items', 'danger');
      this.isLoading = false;
    }
  }

  /**
   * Apply category and search filters
   */
  async applyFilters() {
    let items = this.availableItems.filter(item => item.isAvailable);
    
    // Apply category filter
    if (this.selectedCategory !== 'all') {
      items = items.filter(item => item.category === this.selectedCategory);
    }

    // Apply search filter
    if (this.searchTerm && this.searchTerm.length >= 2) {
      const searchLower = this.searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredItems = items;
  }

  /**
   * Add item to order
   */
  addToOrder(menuItem: MenuItem) {
    // Check if item already in order
    const existingItemIndex = this.orderItems.findIndex(item => item.menuItem.id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity
      this.orderItems[existingItemIndex].quantity++;
    } else {
      // Add new item
      this.orderItems.push({
        menuItem: menuItem,
        quantity: 1,
        subtotal: menuItem.price,
        profit: this.calculateItemProfit(menuItem)
      });
    }
    
    this.updateOrderTotals();
    this.showToast(`${menuItem.name} added to order`, 'success');
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromOrder(index);
      return;
    }
    
    this.orderItems[index].quantity = quantity;
    this.orderItems[index].subtotal = this.orderItems[index].menuItem.price * quantity;
    this.orderItems[index].profit = this.calculateItemProfit(this.orderItems[index].menuItem) * quantity;
    
    this.updateOrderTotals();
  }

  /**
   * Remove item from order
   */
  removeFromOrder(index: number) {
    const removedItem = this.orderItems.splice(index, 1)[0];
    this.updateOrderTotals();
    this.showToast(`${removedItem.menuItem.name} removed from order`, 'warning');
  }

  /**
   * Update item quantity in order
   */
  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromOrder(index);
      return;
    }
    
    this.orderItems[index].quantity = newQuantity;
    this.orderItems[index].subtotal = this.orderItems[index].menuItem.price * newQuantity;
    this.orderItems[index].profit = this.calculateItemProfit(this.orderItems[index].menuItem) * newQuantity;
    this.updateOrderTotals();
  }

  /**
   * Place the order
   */
  async placeOrder() {
    if (!this.customerName.trim()) {
      this.showToast('Please enter customer name', 'danger');
      return;
    }

    if (this.orderItems.length === 0) {
      this.showToast('Please add items to your order', 'danger');
      return;
    }

    this.isLoading = true;

    try {
      // Create order data
      const orderData = {
        customerName: this.customerName,
        customerPhone: this.customerPhone,
        orderType: this.orderType,
        paymentMethod: this.paymentMethod,
        tableNumber: this.tableNumber,
        notes: this.notes,
        items: this.orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        subtotal: this.subtotal,
        tax: this.tax,
        discount: this.discount,
        totalAmount: this.totalAmount,
        totalProfit: this.totalProfit,
        orderDate: new Date().toISOString()
      };

      // Save order using analytics service
      const detailedOrder: Omit<DetailedOrder, 'id' | 'orderNumber' | 'placedAt' | 'seasonalData'> = {
        karenderiaId: 'current-karenderia', // TODO: Get actual karenderia ID
        customerName: this.customerName,
        customerPhone: this.customerPhone || '',
        orderType: this.orderType,
        paymentMethod: this.paymentMethod,
        items: this.orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          subtotal: item.subtotal,
          ingredientCost: item.menuItem.ingredients.reduce((total, ing) => total + ing.cost, 0),
          profitMargin: item.profit,
          preparationTime: item.menuItem.preparationTime
        })),
        subtotal: this.subtotal,
        tax: this.tax,
        discount: this.discount,
        totalAmount: this.totalAmount,
        orderStatus: 'pending'
      };

      // Create order
      const orderId = await this.analyticsService.createDetailedOrder(detailedOrder);

      // Log order details for local menu items
      console.log('Order saved with local menu items:', {
        orderId,
        items: this.orderItems,
        menuItems: this.orderItems.map(item => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price
        }))
      });
      
      this.showToast('Order placed successfully!', 'success');
      
      // Close modal and return order data
      this.modalController.dismiss({
        success: true,
        orderId: orderId,
        orderData: orderData,
        menuItems: this.orderItems
      });
      
    } catch (error) {
      console.error('Error placing order:', error);
      this.showToast('Failed to place order. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculate profit for a menu item
   */
  calculateItemProfit(menuItem: MenuItem): number {
    const ingredientCost = menuItem.ingredients.reduce((total, ingredient) => {
      return total + (ingredient.cost || 0);
    }, 0);
    return menuItem.price - ingredientCost;
  }

  /**
   * Update order totals
   */
  updateOrderTotals() {
    this.subtotal = this.orderItems.reduce((total, item) => total + item.subtotal, 0);
    this.tax = this.subtotal * 0.12; // 12% VAT in Philippines
    this.totalAmount = this.subtotal + this.tax - this.discount;
    this.totalProfit = this.orderItems.reduce((total, item) => total + item.profit, 0);
  }

  /**
   * Apply discount
   */
  applyDiscount(discountAmount: number) {
    this.discount = Math.min(discountAmount, this.subtotal);
    this.updateOrderTotals();
  }

  /**
   * Process the order
   */
  async processOrder() {
    if (this.orderItems.length === 0) {
      this.showToast('Please add items to your order', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Order',
      message: `
        <div style="text-align: left;">
          <p><strong>Items:</strong> ${this.orderItems.length}</p>
          <p><strong>Total:</strong> ${this.formatPhp(this.totalAmount)}</p>
          <p><strong>Expected Profit:</strong> ${this.formatPhp(this.totalProfit)}</p>
          <p><strong>Customer:</strong> ${this.customerName || 'Walk-in'}</p>
          <p><strong>Type:</strong> ${this.orderType}</p>
          <p><strong>Payment:</strong> ${this.paymentMethod}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm Order',
          handler: () => this.saveOrder()
        }
      ]
    });

    await alert.present();
  }

  /**
   * Save order to database
   */
  async saveOrder() {
    this.isLoading = true;
    
    try {
      // Prepare detailed order items
      const detailedItems: DetailedOrderItem[] = this.orderItems.map(item => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: item.menuItem.price,
        subtotal: item.subtotal,
        ingredientCost: item.menuItem.ingredients.reduce((total, ing) => total + (ing.cost || 0), 0) * item.quantity,
        profitMargin: item.profit,
        preparationTime: item.menuItem.preparationTime,
        specialInstructions: '',
        modifications: []
      }));

      // Create detailed order
      const orderData: Omit<DetailedOrder, 'id' | 'orderNumber' | 'placedAt' | 'seasonalData'> = {
        karenderiaId: 'karenderia-id', // Replace with actual karenderia ID
        items: detailedItems,
        customerName: this.customerName || undefined,
        customerPhone: this.customerPhone || undefined,
        orderType: this.orderType,
        subtotal: this.subtotal,
        tax: this.tax,
        discount: this.discount,
        totalAmount: this.totalAmount,
        paymentMethod: this.paymentMethod,
        orderStatus: 'pending',
        notes: this.notes || undefined
      };

      // Save order using analytics service
      const orderId = await this.analyticsService.createDetailedOrder(orderData);
      
      // Log order details for local menu items
      console.log('Order saved with local menu items:', {
        orderId,
        items: this.orderItems,
        menuItems: this.orderItems.map(item => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price
        }))
      });
      
      this.showToast('Order placed successfully!', 'success');
      
      // Close modal and return order data
      this.modalController.dismiss({
        success: true,
        orderId: orderId,
        orderData: orderData,
        menuItems: this.orderItems
      });
      
    } catch (error) {
      console.error('Error saving order:', error);
      this.showToast('Failed to place order. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update inventory after order
   */
  async updateInventory() {
    // This would update ingredient stock levels
    // For now, we'll just log the ingredients that need to be deducted
    console.log('Updating inventory for order items:', this.orderItems);
    
    // TODO: Implement actual inventory update
    // - Loop through each order item
    // - For each ingredient in the item, reduce stock by (ingredient.quantity * item.quantity)
    // - Update ingredient records in database
    // - Check for low stock warnings
  }

  /**
   * Clear the order
   */
  clearOrder() {
    this.orderItems = [];
    this.updateOrderTotals();
    this.showToast('Order cleared', 'warning');
  }

  /**
   * Close modal without saving
   */
  closeModal() {
    this.modalController.dismiss({
      success: false
    });
  }

  /**
   * Switch tabs
   */
  switchTab(tab: 'menu' | 'cart' | 'details') {
    this.activeTab = tab;
  }

  /**
   * Format Philippine Peso
   */
  formatPhp(amount: number): string {
    return this.analyticsService.formatPhp(amount);
  }

  /**
   * Show toast message
   */
  async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Get order items count
   */
  getOrderItemsCount(): number {
    return this.orderItems.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Check if item is in order
   */
  isItemInOrder(menuItemId: string): boolean {
    return this.orderItems.some(item => item.menuItem.id === menuItemId);
  }

  /**
   * Get item quantity in order
   */
  getItemQuantityInOrder(menuItemId: string): number {
    const orderItem = this.orderItems.find(item => item.menuItem.id === menuItemId);
    return orderItem ? orderItem.quantity : 0;
  }

  onCategoryChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  /**
   * Handle image error
   */
  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder-food.jpg';
  }

  /**
   * Get index of order item by menu item ID
   */
  getOrderItemIndex(menuItemId: string): number {
    return this.orderItems.findIndex(oi => oi.menuItem.id === menuItemId);
  }

  /**
   * Test API method
   */
  async testApi() {
    try {
      const response = await this.spoonacularService.testApi().toPromise();
      console.log('API Response:', response);
    } catch (error) {
      console.error('API Error:', error);
    }
  }
}
