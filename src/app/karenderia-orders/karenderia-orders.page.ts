import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { MenuService } from '../services/menu.service';
import { firstValueFrom } from 'rxjs';

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
  selectedTab: string = 'active';
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Order statistics
  pendingOrders: number = 0;
  confirmedOrders: number = 0;
  preparingOrders: number = 0;
  readyOrders: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private karenderiaInfoService: KarenderiaInfoService,
    private menuService: MenuService
  ) { }

  ngOnInit() {
    this.loadOrders();
  }

  // Navigation methods
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  logout() {
    this.authService.logoutAndRedirect();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.filterOrders();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.filterOrders();
  }

  refreshOrders() {
    this.loadOrders();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterOrders();
  }

  setStatusFilter(status: string) {
    this.selectedStatus = status;
    this.filterOrders();
  }

  // Order management methods
  async loadOrders() {
    this.isLoading = true;
    try {
      await this.menuService.loadOrders();
      const backendOrders: any[] = await firstValueFrom(this.menuService.orders$);

      this.orders = (backendOrders || []).map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        return {
          id: String(order.id || ''),
          customerName: order.customerName || order.customer_name || 'Customer',
          customerPhone: order.customerPhone || order.customer_phone || '',
          orderType: (order.orderType || order.order_type || 'delivery') === 'takeout' ? 'pickup' : (order.orderType || order.order_type || 'delivery'),
          status: order.status || 'pending',
          items: items.map((item: any) => ({
            name: item.menuItemName || item.menu_item_name || item.name || 'Item',
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0)
          })),
          subtotal: Number(order.subtotal || 0),
          deliveryFee: Number(order.deliveryFee || order.delivery_fee || 0),
          total: Number(order.totalAmount || order.total_amount || order.total || 0),
          createdAt: new Date(order.createdAt || order.created_at || Date.now())
        } as Order;
      });

      this.updateOrderStats();
      this.filterOrders();
    } catch (error) {
      console.error('Failed to load orders:', error);
      this.orders = [];
      this.filteredOrders = [];
      this.updateOrderStats();
    } finally {
      this.isLoading = false;
    }
  }

  filterOrders() {
    let filtered = [...this.orders];
    
    // Filter by tab (active vs history)
    if (this.selectedTab === 'active') {
      filtered = filtered.filter(order => 
        order.status === 'pending' || 
        order.status === 'confirmed' || 
        order.status === 'preparing' || 
        order.status === 'ready'
      );
    } else if (this.selectedTab === 'history') {
      filtered = filtered.filter(order => order.status === 'completed');
    }
    
    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }
    
    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerPhone.includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }
    
    this.filteredOrders = filtered;
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

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }
}
