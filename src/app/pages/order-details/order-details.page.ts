import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { DetailedOrder, DetailedOrderItem } from '../../models/menu.model';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { Firestore, collection, query, where, orderBy, limit, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.page.html',
  styleUrls: ['./order-details.page.scss'],
  standalone: false
})
export class OrderDetailsPage implements OnInit {
  orders: DetailedOrder[] = [];
  filteredOrders: DetailedOrder[] = [];
  
  // Filters
  selectedStatus: string = 'all';
  selectedPeriod: string = 'today';
  searchTerm: string = '';
  
  // Analytics from orders
  totalRevenue: number = 0;
  totalProfit: number = 0;
  averageOrderValue: number = 0;
  topCustomers: any[] = [];
  
  // UI states
  isLoading: boolean = false;
  selectedOrder: DetailedOrder | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private firestore: Firestore
  ) { }

  async ngOnInit() {
    await this.loadOrders();
    this.calculateOrderAnalytics();
  }

  /**
   * Load orders from database with filters
   */
  async loadOrders() {
    this.isLoading = true;
    
    try {
      const ordersCollection = collection(this.firestore, 'detailed_orders');
      let ordersQuery = query(
        ordersCollection,
        where('karenderiaId', '==', 'karenderia-id'), // Replace with actual ID
        orderBy('placedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(ordersQuery);
      this.orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          placedAt: data['placedAt']?.toDate ? data['placedAt'].toDate() : new Date(data['placedAt']),
          preparedAt: data['preparedAt']?.toDate ? data['preparedAt'].toDate() : (data['preparedAt'] ? new Date(data['preparedAt']) : undefined),
          completedAt: data['completedAt']?.toDate ? data['completedAt'].toDate() : (data['completedAt'] ? new Date(data['completedAt']) : undefined)
        };
      }) as DetailedOrder[];

      this.applyFilters();
      
    } catch (error) {
      console.error('Error loading orders:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load orders',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply filters to orders
   */
  applyFilters() {
    let filtered = [...this.orders];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === this.selectedStatus);
    }

    // Filter by period
    const now = new Date();
    switch (this.selectedPeriod) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(order => new Date(order.placedAt) >= today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.placedAt) >= weekAgo);
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(order => new Date(order.placedAt) >= monthStart);
        break;
    }

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.items.some(item => item.menuItemName.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    this.filteredOrders = filtered;
    this.calculateOrderAnalytics();
  }

  /**
   * Calculate analytics from filtered orders
   */
  calculateOrderAnalytics() {
    if (this.filteredOrders.length === 0) {
      this.totalRevenue = 0;
      this.totalProfit = 0;
      this.averageOrderValue = 0;
      this.topCustomers = [];
      return;
    }

    this.totalRevenue = this.filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    this.totalProfit = this.filteredOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.profitMargin, 0), 0
    );
    this.averageOrderValue = this.totalRevenue / this.filteredOrders.length;

    // Calculate top customers
    const customerStats: { [key: string]: { name: string; orders: number; spent: number; } } = {};
    
    this.filteredOrders.forEach(order => {
      if (order.customerName) {
        if (!customerStats[order.customerName]) {
          customerStats[order.customerName] = {
            name: order.customerName,
            orders: 0,
            spent: 0
          };
        }
        customerStats[order.customerName].orders++;
        customerStats[order.customerName].spent += order.totalAmount;
      }
    });

    this.topCustomers = Object.values(customerStats)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }

  /**
   * View detailed order information
   */
  async viewOrderDetails(order: DetailedOrder) {
    const alert = await this.alertController.create({
      header: `Order ${order.orderNumber}`,
      message: `
        <div style="text-align: left;">
          <p><strong>Customer:</strong> ${order.customerName || 'Walk-in'}</p>
          <p><strong>Type:</strong> ${order.orderType}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod}</p>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
          <p><strong>Season:</strong> ${order.seasonalData.season}</p>
          <p><strong>Time:</strong> ${order.seasonalData.timeOfDay}</p>
          <br>
          <p><strong>Items:</strong></p>
          ${order.items.map(item => `
            <p>• ${item.quantity}x ${item.menuItemName} - ${this.formatPhp(item.subtotal)}<br>
            &nbsp;&nbsp;Profit: ${this.formatPhp(item.profitMargin)} (${((item.profitMargin/item.subtotal)*100).toFixed(1)}%)</p>
          `).join('')}
          <br>
          <p><strong>Total:</strong> ${this.formatPhp(order.totalAmount)}</p>
          <p><strong>Total Profit:</strong> ${this.formatPhp(order.items.reduce((sum, item) => sum + item.profitMargin, 0))}</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Print Receipt',
          handler: () => this.printReceipt(order)
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(order: DetailedOrder, newStatus: DetailedOrder['orderStatus']) {
    try {
      await this.analyticsService.updateOrderStatus(order.id!, newStatus);
      
      // Update local order
      const index = this.orders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        this.orders[index].orderStatus = newStatus;
        this.applyFilters();
      }

      const toast = await this.toastController.create({
        message: `Order ${order.orderNumber} updated to ${newStatus}`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update order status',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Print receipt (placeholder for actual printing)
   */
  printReceipt(order: DetailedOrder) {
    console.log('Printing receipt for order:', order.orderNumber);
    // Here you would integrate with a receipt printer or generate PDF
  }

  /**
   * Analyze order patterns
   */
  async analyzeOrderPatterns() {
    const patterns = this.getOrderPatterns();
    
    const alert = await this.alertController.create({
      header: '📊 Order Pattern Analysis',
      message: `
        <div style="text-align: left;">
          <p><strong>Peak Hours:</strong></p>
          ${patterns.peakHours.map(hour => `<p>• ${hour.time}: ${hour.orders} orders</p>`).join('')}
          <br>
          <p><strong>Popular Items:</strong></p>
          ${patterns.popularItems.map(item => `<p>• ${item.name}: ${item.quantity} sold</p>`).join('')}
          <br>
          <p><strong>Customer Behavior:</strong></p>
          <p>• Average order value: ${this.formatPhp(this.averageOrderValue)}</p>
          <p>• Repeat customers: ${patterns.repeatCustomers}%</p>
          <p>• Takeout vs Dine-in: ${patterns.takeoutPercentage}% / ${(100-patterns.takeoutPercentage)}%</p>
          <br>
          <p><strong>💡 Recommendations:</strong></p>
          ${patterns.recommendations.map(rec => `<p>• ${rec}</p>`).join('')}
        </div>
      `,
      buttons: ['Close']
    });

    await alert.present();
  }

  /**
   * Get order patterns and insights
   */
  getOrderPatterns() {
    // Analyze peak hours
    const hourCounts: { [key: string]: number } = {};
    this.filteredOrders.forEach(order => {
      const hour = new Date(order.placedAt).getHours();
      const timeSlot = order.seasonalData.timeOfDay;
      hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([time, orders]) => ({ time, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3);

    // Analyze popular items
    const itemCounts: { [key: string]: { name: string; quantity: number; } } = {};
    this.filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = {
            name: item.menuItemName,
            quantity: 0
          };
        }
        itemCounts[item.menuItemId].quantity += item.quantity;
      });
    });

    const popularItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate customer behavior metrics
    const customersWithNames = this.filteredOrders.filter(o => o.customerName);
    const uniqueCustomers = new Set(customersWithNames.map(o => o.customerName)).size;
    const repeatCustomers = customersWithNames.length - uniqueCustomers;
    const repeatCustomerPercentage = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    const takeoutOrders = this.filteredOrders.filter(o => o.orderType === 'takeout').length;
    const takeoutPercentage = (takeoutOrders / this.filteredOrders.length) * 100;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (takeoutPercentage > 70) {
      recommendations.push('High takeout demand - consider delivery service expansion');
    }
    
    if (repeatCustomerPercentage < 30) {
      recommendations.push('Focus on customer retention programs');
    }
    
    if (popularItems.length > 0) {
      recommendations.push(`Promote ${popularItems[0].name} as it's your top seller`);
    }
    
    const currentSeason = this.getCurrentSeason();
    recommendations.push(`It's ${currentSeason} season - adjust menu accordingly`);

    return {
      peakHours,
      popularItems,
      repeatCustomers: Math.round(repeatCustomerPercentage),
      takeoutPercentage: Math.round(takeoutPercentage),
      recommendations
    };
  }

  /**
   * Export order data
   */
  async exportOrders() {
    const csvData = this.generateCSV();
    // Here you would typically download the CSV file
    console.log('CSV Data:', csvData);
    
    const toast = await this.toastController.create({
      message: 'Order data exported successfully',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }

  generateCSV(): string {
    const headers = [
      'Order Number', 'Date', 'Customer', 'Type', 'Status', 'Payment Method',
      'Items', 'Total Amount', 'Profit', 'Season', 'Time of Day'
    ];
    
    const rows = this.filteredOrders.map(order => [
      order.orderNumber,
      new Date(order.placedAt).toLocaleDateString(),
      order.customerName || 'Walk-in',
      order.orderType,
      order.orderStatus,
      order.paymentMethod,
      order.items.map(item => `${item.quantity}x ${item.menuItemName}`).join('; '),
      order.totalAmount.toString(),
      order.items.reduce((sum, item) => sum + item.profitMargin, 0).toString(),
      order.seasonalData.season,
      order.seasonalData.timeOfDay
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  formatPhp(amount: number): string {
    return this.analyticsService.formatPhp(amount);
  }

  getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return month === 12 ? 'christmas' : 'dry';
    if (month >= 3 && month <= 5) return 'summer';
    return 'wet';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'warning',
      'preparing': 'primary',
      'ready': 'success',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  getOrderTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'dine-in': 'restaurant',
      'takeout': 'bag',
      'delivery': 'bicycle'
    };
    return icons[type] || 'help';
  }

  /**
   * Calculate total profit for an order
   */
  calculateOrderProfit(order: DetailedOrder): number {
    return order.items.reduce((sum, item) => sum + item.profitMargin, 0);
  }

  /**
   * Calculate profit margin percentage for an item
   */
  calculateProfitMarginPercentage(item: DetailedOrderItem): number {
    return ((item.profitMargin / item.subtotal) * 100);
  }
}
