import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem, Ingredient, MenuCategory, Order, DailySales } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.apiUrl;
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  private categoriesSubject = new BehaviorSubject<MenuCategory[]>([]);
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  menuItems$ = this.menuItemsSubject.asObservable();
  ingredients$ = this.ingredientsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCategories();
    this.loadIngredients();
    this.loadMenuItems();
    this.loadOrders();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Format PHP currency
  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // MENU ITEMS
  async loadMenuItems(): Promise<void> {
    try {
      const response = await this.http.get<{ data: any[] }>(`${this.apiUrl}/menu-items`, {
        headers: this.getHeaders()
      }).toPromise();
      
      // Map backend field names to frontend field names
      const mappedItems: MenuItem[] = (response?.data || []).map(item => ({
        ...item,
        isAvailable: item.is_available !== undefined ? item.is_available : item.isAvailable,
        isPopular: item.is_popular !== undefined ? item.is_popular : item.isPopular,
        preparationTime: item.preparation_time !== undefined ? item.preparation_time : item.preparationTime,
        createdAt: item.created_at ? new Date(item.created_at) : item.createdAt,
        updatedAt: item.updated_at ? new Date(item.updated_at) : item.updatedAt
      }));
      
      this.menuItemsSubject.next(mappedItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  }

  async addMenuItem(menuItem: Partial<MenuItem>): Promise<string> {
    // Map frontend field names to backend field names
    const backendMenuItem: any = { ...menuItem };
    
    if ('isAvailable' in menuItem) {
      backendMenuItem.is_available = menuItem.isAvailable;
      delete backendMenuItem.isAvailable;
    }
    
    if ('isPopular' in menuItem) {
      backendMenuItem.is_popular = menuItem.isPopular;
      delete backendMenuItem.isPopular;
    }
    
    if ('preparationTime' in menuItem) {
      backendMenuItem.preparation_time = menuItem.preparationTime;
      delete backendMenuItem.preparationTime;
    }
    
    if ('createdAt' in menuItem) {
      backendMenuItem.created_at = menuItem.createdAt;
      delete backendMenuItem.createdAt;
    }
    
    if ('updatedAt' in menuItem) {
      backendMenuItem.updated_at = menuItem.updatedAt;
      delete backendMenuItem.updatedAt;
    }
    
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/menu-items`, backendMenuItem, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
    return response?.data.id || '';
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    // Map frontend field names to backend field names
    const backendUpdates: any = { ...updates };
    
    if ('isAvailable' in updates) {
      backendUpdates.is_available = updates.isAvailable;
      delete backendUpdates.isAvailable;
    }
    
    if ('updatedAt' in updates) {
      backendUpdates.updated_at = updates.updatedAt;
      delete backendUpdates.updatedAt;
    }
    
    if ('createdAt' in updates) {
      backendUpdates.created_at = updates.createdAt;
      delete backendUpdates.createdAt;
    }
    
    if ('preparationTime' in updates) {
      backendUpdates.preparation_time = updates.preparationTime;
      delete backendUpdates.preparationTime;
    }
    
    if ('isPopular' in updates) {
      backendUpdates.is_popular = updates.isPopular;
      delete backendUpdates.isPopular;
    }
    
    await this.http.put(`${this.apiUrl}/menu-items/${id}`, backendUpdates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/menu-items/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
  }

  // INGREDIENTS
  async loadIngredients(): Promise<void> {
    try {
      const response = await this.http.get<{ data: Ingredient[] }>(`${this.apiUrl}/ingredients`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.ingredientsSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<string> {
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/ingredients`, ingredient, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
    return response?.data.id || '';
  }

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    await this.http.put(`${this.apiUrl}/ingredients/${id}`, updates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/ingredients/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
  }

  // CATEGORIES
  async loadCategories(): Promise<void> {
    try {
      const response = await this.http.get<{ data: MenuCategory[] }>(`${this.apiUrl}/menu-categories`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.categoriesSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async addCategory(category: Omit<MenuCategory, 'id'>): Promise<string> {
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/menu-categories`, category, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
    return response?.data.id || '';
  }

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<void> {
    await this.http.put(`${this.apiUrl}/menu-categories/${id}`, updates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
  }

  async deleteCategory(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/menu-categories/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
  }

  // ORDERS
  async loadOrders(): Promise<void> {
    try {
      const response = await this.http.get<{ data: Order[] }>(`${this.apiUrl}/orders`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.ordersSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    await this.http.put(`${this.apiUrl}/orders/${id}`, { status }, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadOrders();
  }

  // ANALYTICS
  async getDailySales(date: Date): Promise<DailySales> {
    const params = { date: date.toISOString().split('T')[0] };
    
    const response = await this.http.get<{ data: DailySales }>(`${this.apiUrl}/analytics/daily-sales`, {
      headers: this.getHeaders(),
      params
    }).toPromise();
    
    return response?.data || {
      date,
      totalSales: 0,
      totalOrders: 0,
      popularItems: []
    };
  }

  // Get low stock ingredients
  getLowStockIngredients(): Observable<Ingredient[]> {
    return new Observable(observer => {
      this.ingredients$.subscribe(ingredients => {
        const lowStock = ingredients.filter(ing => ing.stock <= ing.minimumStock);
        observer.next(lowStock);
      });
    });
  }
}
