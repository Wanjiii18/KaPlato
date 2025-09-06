import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../services/menu.service';
import { AuthService } from '../services/auth.service';
import { MenuItem, Order, Ingredient, DailySales } from '../models/menu.model';

@Component({
  selector: 'app-karenderia-dashboard',
  templateUrl: './karenderia-dashboard.page.html',
  styleUrls: ['./karenderia-dashboard.page.scss'],
  standalone: false,
})
export class KarenderiaDashboardPage implements OnInit {
  todaysSales: DailySales | null = null;
  recentOrders: Order[] = [];
  lowStockItems: Ingredient[] = [];
  menuItemsCount = 0;
  pendingOrdersCount = 0;
  totalRevenue = 0;
  isLoading = true;
  avgOrderValue = 173;
  displayOrders: any[] = [];

  constructor(
    private router: Router,
    private menuService: MenuService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    try {
      await this.loadDashboardData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Continue with empty/default data instead of hanging
    } finally {
      this.isLoading = false;
    }
  }

  async loadDashboardData() {
    try {
      // Load today's sales with timeout
      const salesPromise = Promise.race([
        this.menuService.getDailySales(new Date()),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Sales data timeout')), 3000)
        )
      ]);
      
      this.todaysSales = await salesPromise.catch(() => ({
        date: new Date(),
        totalSales: 15420,
        totalOrders: 89,
        popularItems: []
      }));
      
      // Load recent orders with timeout
      const ordersSubscription = this.menuService.orders$.subscribe(orders => {
        this.recentOrders = orders.slice(0, 5);
        this.pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
      });
      
      // Auto-unsubscribe after 5 seconds if no data
      setTimeout(() => {
        if (this.recentOrders.length === 0) {
          ordersSubscription.unsubscribe();
        }
      }, 5000);

      // Load low stock items with timeout
      const stockSubscription = this.menuService.getLowStockIngredients().subscribe(items => {
        this.lowStockItems = items;
      });
      
      // Auto-unsubscribe after 5 seconds if no data
      setTimeout(() => {
        if (this.lowStockItems.length === 0) {
          stockSubscription.unsubscribe();
        }
      }, 5000);

      // Load menu items count with timeout
      const itemsSubscription = this.menuService.menuItems$.subscribe(items => {
        this.menuItemsCount = items.length;
      });
      
      // Auto-unsubscribe after 5 seconds if no data
      setTimeout(() => {
        itemsSubscription.unsubscribe();
      }, 5000);

      // Generate sample data for demo
      this.generateSampleData();
      
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      // Set default values so the page doesn't hang
      this.todaysSales = {
        date: new Date(),
        totalSales: 15420,
        totalOrders: 89,
        popularItems: []
      };
      this.recentOrders = [];
      this.lowStockItems = [];
      this.menuItemsCount = 25;
      this.pendingOrdersCount = 8;
      this.generateSampleData();
    }
  }

  generateSampleData() {
    // Sample recent orders for the new modern design
    this.displayOrders = [
      {
        id: 123,
        customerName: "Maria Santos",
        itemsText: "Adobong Manok, Rice",
        totalAmount: 285,
        status: "active",
        timeAgo: "5 min ago"
      },
      {
        id: 122,
        customerName: "Juan Dela Cruz",
        itemsText: "Sinigang na Baboy, Rice",
        totalAmount: 320,
        status: "completed",
        timeAgo: "12 min ago"
      },
      {
        id: 121,
        customerName: "Ana Garcia",
        itemsText: "Kare-Kare, Rice, Drinks",
        totalAmount: 450,
        status: "completed",
        timeAgo: "18 min ago"
      },
      {
        id: 120,
        customerName: "Pedro Reyes",
        itemsText: "Lechon Kawali, Rice",
        totalAmount: 360,
        status: "active",
        timeAgo: "22 min ago"
      },
      {
        id: 119,
        customerName: "Carmen Torres",
        itemsText: "Chicken Curry, Rice",
        totalAmount: 290,
        status: "completed",
        timeAgo: "28 min ago"
      }
    ];

    // Keep the old format for compatibility
    this.recentOrders = this.displayOrders.map(order => ({
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      items: [order.itemsText],
      status: order.status,
      createdAt: new Date(Date.now() - Math.random() * 3600000)
    })) as Order[];
  }

  navigateToMenu() {
    this.router.navigate(['/karenderia-menu']);
  }

  navigateToIngredients() {
    this.router.navigate(['/karenderia-ingredients']);
  }

  navigateToOrders() {
    this.router.navigate(['/karenderia-orders']);
  }

  navigateToPos() {
    this.router.navigate(['/karenderia/pos']);
  }

  navigateToAnalytics() {
    this.router.navigate(['/karenderia-analytics']);
  }

  formatPhp(amount: number): string {
    return this.menuService.formatPhp(amount);
  }

  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'preparing': return 'secondary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  logout() {
    this.authService.logoutAndRedirect();
  }
}
