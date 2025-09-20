import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DetailedOrder, DetailedOrderItem, SalesAnalytics } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiUrl;
  private ordersSubject = new BehaviorSubject<DetailedOrder[]>([]);
  private analyticsSubject = new BehaviorSubject<SalesAnalytics | null>(null);

  orders$ = this.ordersSubject.asObservable();
  analytics$ = this.analyticsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Create a detailed order with analytics data
   */
  async createDetailedOrder(order: Omit<DetailedOrder, 'id' | 'orderNumber' | 'placedAt' | 'seasonalData'>): Promise<string> {
    try {
      // Add seasonal and time-based analytics data
      const seasonalData = this.generateSeasonalData();
      
      const detailedOrder = {
        ...order,
        seasonalData,
        orderStatus: 'pending'
      };

      const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/orders`, detailedOrder, {
        headers: this.getHeaders()
      }).toPromise();
      
      // Update local state
      this.loadOrders();
      
      return response?.data.id || '';
    } catch (error) {
      console.error('Error creating detailed order:', error);
      throw error;
    }
  }

  /**
   * Update order status and track completion time
   */
  async updateOrderStatus(orderId: string, status: DetailedOrder['orderStatus']): Promise<void> {
    try {
      const updateData: any = { orderStatus: status };

      if (status === 'preparing') {
        updateData.preparedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      await this.http.put(`${this.apiUrl}/orders/${orderId}`, updateData, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Generate seasonal analytics data based on current date/time
   */
  private generateSeasonalData(): DetailedOrder['seasonalData'] {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0-6

    // Philippine seasons
    let season: 'dry' | 'wet' | 'summer' | 'christmas';
    if (month >= 12 || month <= 2) {
      season = month === 12 ? 'christmas' : 'dry';
    } else if (month >= 3 && month <= 5) {
      season = 'summer';
    } else {
      season = 'wet';
    }

    // Time of day categorization
    let timeOfDay: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'late-night';
    if (hour >= 6 && hour < 10) {
      timeOfDay = 'breakfast';
    } else if (hour >= 10 && hour < 14) {
      timeOfDay = 'lunch';
    } else if (hour >= 14 && hour < 17) {
      timeOfDay = 'merienda';
    } else if (hour >= 17 && hour < 22) {
      timeOfDay = 'dinner';
    } else {
      timeOfDay = 'late-night';
    }

    return {
      season,
      month,
      dayOfWeek,
      timeOfDay
    };
  }

  /**
   * Calculate item profitability
   */
  calculateItemProfitability(orderItem: DetailedOrderItem): number {
    return ((orderItem.profitMargin / orderItem.subtotal) * 100);
  }

  /**
   * Get popular items by season
   */
  async getPopularItemsBySeason(karenderiaId: string, season: string): Promise<any[]> {
    try {
      const params = { karenderiaId, season };
      const response = await this.http.get<{ data: any[] }>(`${this.apiUrl}/analytics/popular-items/season`, {
        headers: this.getHeaders(),
        params
      }).toPromise();

      return response?.data || [];
    } catch (error) {
      console.error('Error getting popular items by season:', error);
      return [];
    }
  }

  /**
   * Get sales analytics for a specific period
   */
  async getSalesAnalytics(karenderiaId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<SalesAnalytics | null> {
    try {
      const params = { period };
      const response = await this.http.get<{ data: SalesAnalytics }>(`${this.apiUrl}/analytics/sales/${karenderiaId}`, {
        headers: this.getHeaders(),
        params
      }).toPromise();

      const analytics = response?.data || null;
      this.analyticsSubject.next(analytics);
      return analytics;
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      return null;
    }
  }

  private async loadOrders(): Promise<void> {
    try {
      const response = await this.http.get<{ data: DetailedOrder[] }>(`${this.apiUrl}/orders/recent`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.ordersSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  /**
   * Format PHP currency
   */
  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations(season: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      'summer': [
        'Promote cold beverages and refreshing items',
        'Consider offering more ice-based desserts',
        'Lighter meals tend to perform better',
        'Extend operating hours for evening sales'
      ],
      'wet': [
        'Hot soups and warm comfort foods are popular',
        'Consider delivery promotions due to rain',
        'Hearty meals with longer shelf life',
        'Indoor dining promotions'
      ],
      'dry': [
        'Balanced menu performs well',
        'Good time for trying new items',
        'Focus on consistent quality',
        'Build customer loyalty programs'
      ],
      'christmas': [
        'Special holiday menu items',
        'Family-size portions and packages',
        'Premium pricing opportunities',
        'Gift certificates and catering services'
      ]
    };

    return recommendations[season] || ['Monitor sales patterns for insights'];
  }
}
