import { Component, OnInit } from '@angular/core';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  total: number;
  createdAt: Date;
}

@Component({
  selector: 'app-karenderia-orders',
  templateUrl: './karenderia-orders.page.html',
  styleUrls: ['./karenderia-orders.page.scss'],
  standalone: false,
})
export class KarenderiaOrdersPage implements OnInit {
  // Order management properties
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus: string = 'all';
  isLoading: boolean = false;
  
  // Order statistics
  pendingOrders: number = 0;
  confirmedOrders: number = 0;
  preparingOrders: number = 0;
  readyOrders: number = 0;

  constructor() { }

  ngOnInit() {
    this.loadOrders();
  }

  // Navigation methods
  goBack() {
    window.history.back();
  }

  refreshOrders() {
    this.loadOrders();
  }

  showFilters() {
    // Implement filter modal
    console.log('Show filters');
  }

  // Order management methods
  loadOrders() {
    this.isLoading = true;
    
    // Mock data for demonstration
    setTimeout(() => {
      this.orders = [
        {
          id: '001',
          customerName: 'Juan Dela Cruz',
          customerPhone: '+63 912 345 6789',
          orderType: 'delivery',
          status: 'pending',
          items: [
            { name: 'Adobo Rice', quantity: 2, price: 85 },
            { name: 'Iced Tea', quantity: 2, price: 25 }
          ],
          subtotal: 220,
          deliveryFee: 30,
          total: 250,
          createdAt: new Date()
        }
      ];
      
      this.updateOrderStats();
      this.filterOrders();
      this.isLoading = false;
    }, 1000);
  }

  filterOrders() {
    if (this.selectedStatus === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }
  }

  updateOrderStats() {
    this.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
    this.confirmedOrders = this.orders.filter(o => o.status === 'confirmed').length;
    this.preparingOrders = this.orders.filter(o => o.status === 'preparing').length;
    this.readyOrders = this.orders.filter(o => o.status === 'ready').length;
  }

  // Order action methods
  confirmOrder(order: Order) {
    order.status = 'confirmed';
    this.updateOrderStats();
    console.log('Order confirmed:', order.id);
  }

  startPreparing(order: Order) {
    order.status = 'preparing';
    this.updateOrderStats();
    console.log('Started preparing order:', order.id);
  }

  markAsReady(order: Order) {
    order.status = 'ready';
    this.updateOrderStats();
    console.log('Order marked as ready:', order.id);
  }

  completeOrder(order: Order) {
    order.status = 'completed';
    this.updateOrderStats();
    console.log('Order completed:', order.id);
  }

  viewOrderDetails(order: Order) {
    console.log('Viewing order details:', order);
  }

  cancelOrder(order: Order) {
    const index = this.orders.indexOf(order);
    if (index > -1) {
      this.orders.splice(index, 1);
      this.updateOrderStats();
      this.filterOrders();
    }
    console.log('Order cancelled:', order.id);
  }

  exportOrders() {
    console.log('Exporting orders');
  }

  // Utility methods
  getStatusColor(status: string): string {
    const colors: {[key: string]: string} = {
      'pending': 'warning',
      'confirmed': 'success',
      'preparing': 'primary',
      'ready': 'secondary',
      'completed': 'medium'
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: {[key: string]: string} = {
      'pending': 'time',
      'confirmed': 'checkmark-circle',
      'preparing': 'restaurant',
      'ready': 'bag-check',
      'completed': 'checkmark-done'
    };
    return icons[status] || 'help';
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }
}
