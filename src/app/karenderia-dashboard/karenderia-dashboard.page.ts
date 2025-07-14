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

  constructor(
    private router: Router,
    private menuService: MenuService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    // Load today's sales
    this.todaysSales = await this.menuService.getDailySales(new Date());
    
    // Load recent orders
    this.menuService.orders$.subscribe(orders => {
      this.recentOrders = orders.slice(0, 5);
      this.pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    });

    // Load low stock items
    this.menuService.getLowStockIngredients().subscribe(items => {
      this.lowStockItems = items;
    });

    // Load menu items count
    this.menuService.menuItems$.subscribe(items => {
      this.menuItemsCount = items.length;
    });
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
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails on server, we still redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}
