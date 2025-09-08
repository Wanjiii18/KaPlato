import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KarenderiaInfoService } from '../services/karenderia-info.service';

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

  constructor(private router: Router, private karenderiaInfoService: KarenderiaInfoService) { }

  ngOnInit() {
    this.loadOrders();
  }

  // Navigation methods
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  logout() {
    // Implement logout logic
    console.log('Logging out...');
    this.router.navigate(['/login']);
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
        },
        {
          id: '002',
          customerName: 'Maria Santos',
          customerPhone: '+63 917 123 4567',
          orderType: 'pickup',
          status: 'confirmed',
          items: [
            { name: 'Sisig Rice', quantity: 1, price: 95 },
            { name: 'Halo-halo', quantity: 1, price: 65 }
          ],
          subtotal: 160,
          total: 160,
          createdAt: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: '003',
          customerName: 'Pedro Reyes',
          customerPhone: '+63 920 987 6543',
          orderType: 'delivery',
          status: 'preparing',
          items: [
            { name: 'Lechon Kawali', quantity: 1, price: 120 },
            { name: 'Garlic Rice', quantity: 2, price: 45 },
            { name: 'Soda', quantity: 2, price: 30 }
          ],
          subtotal: 240,
          deliveryFee: 35,
          total: 275,
          createdAt: new Date(Date.now() - 45 * 60 * 1000)
        },
        {
          id: '004',
          customerName: 'Ana Lopez',
          customerPhone: '+63 918 555 1234',
          orderType: 'pickup',
          status: 'ready',
          items: [
            { name: 'Kare-kare', quantity: 1, price: 130 },
            { name: 'Rice', quantity: 1, price: 25 }
          ],
          subtotal: 155,
          total: 155,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          id: '005',
          customerName: 'Carlos Rivera',
          customerPhone: '+63 915 444 5678',
          orderType: 'delivery',
          status: 'completed',
          items: [
            { name: 'Longganisa Rice', quantity: 2, price: 75 },
            { name: 'Coffee', quantity: 2, price: 35 }
          ],
          subtotal: 220,
          deliveryFee: 25,
          total: 245,
          createdAt: new Date(Date.now() - 120 * 60 * 1000)
        },
        {
          id: '006',
          customerName: 'Rosa Martinez',
          customerPhone: '+63 919 333 7890',
          orderType: 'pickup',
          status: 'completed',
          items: [
            { name: 'Pancit Canton', quantity: 1, price: 80 },
            { name: 'Lumpia', quantity: 5, price: 50 }
          ],
          subtotal: 130,
          total: 130,
          createdAt: new Date(Date.now() - 180 * 60 * 1000)
        }
      ];
      
      this.updateOrderStats();
      this.filterOrders();
      this.isLoading = false;
    }, 1000);
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
