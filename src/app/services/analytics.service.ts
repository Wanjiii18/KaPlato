import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { DetailedOrder, DetailedOrderItem, SalesAnalytics } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private ordersSubject = new BehaviorSubject<DetailedOrder[]>([]);
  private analyticsSubject = new BehaviorSubject<SalesAnalytics | null>(null);

  orders$ = this.ordersSubject.asObservable();
  analytics$ = this.analyticsSubject.asObservable();

  constructor(private firestore: Firestore) {}

  /**
   * Create a detailed order with analytics data
   */
  async createDetailedOrder(order: Omit<DetailedOrder, 'id' | 'orderNumber' | 'placedAt' | 'seasonalData'>): Promise<string> {
    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();
      
      // Add seasonal and time-based analytics data
      const seasonalData = this.generateSeasonalData();
      
      const detailedOrder: DetailedOrder = {
        ...order,
        orderNumber,
        placedAt: new Date(),
        seasonalData,
        orderStatus: 'pending'
      };

      // Add to Firestore
      const ordersCollection = collection(this.firestore, 'detailed_orders');
      const docRef = await addDoc(ordersCollection, detailedOrder);
      
      // Update local state
      this.loadOrders();
      
      // Update analytics
      await this.updateDailyAnalytics(detailedOrder);
      
      return docRef.id;
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
      const orderRef = doc(this.firestore, 'detailed_orders', orderId);
      const updateData: any = { orderStatus: status };

      if (status === 'preparing') {
        updateData.preparedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      await updateDoc(orderRef, updateData);
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
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Get today's order count
    const todayStart = new Date(year, now.getMonth(), now.getDate());
    const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1);
    
    const ordersCollection = collection(this.firestore, 'detailed_orders');
    const todayOrders = query(
      ordersCollection,
      where('placedAt', '>=', todayStart),
      where('placedAt', '<', todayEnd)
    );
    
    const snapshot = await getDocs(todayOrders);
    const orderCount = snapshot.size + 1;
    
    return `KP-${year}${month}${day}-${String(orderCount).padStart(4, '0')}`;
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
      const ordersCollection = collection(this.firestore, 'detailed_orders');
      const seasonalOrdersQuery = query(
        ordersCollection,
        where('karenderiaId', '==', karenderiaId),
        where('seasonalData.season', '==', season),
        orderBy('placedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(seasonalOrdersQuery);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DetailedOrder[];

      // Aggregate item sales
      const itemSales: { [key: string]: { name: string; quantity: number; revenue: number; profit: number; } } = {};

      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemSales[item.menuItemId]) {
            itemSales[item.menuItemId] = {
              name: item.menuItemName,
              quantity: 0,
              revenue: 0,
              profit: 0
            };
          }
          itemSales[item.menuItemId].quantity += item.quantity;
          itemSales[item.menuItemId].revenue += item.subtotal;
          itemSales[item.menuItemId].profit += item.profitMargin;
        });
      });

      // Convert to array and sort by quantity
      return Object.entries(itemSales)
        .map(([id, data]) => ({ menuItemId: id, ...data }))
        .sort((a, b) => b.quantity - a.quantity);

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
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const ordersCollection = collection(this.firestore, 'detailed_orders');
      const periodQuery = query(
        ordersCollection,
        where('karenderiaId', '==', karenderiaId),
        where('placedAt', '>=', startDate),
        where('orderStatus', '==', 'completed')
      );

      const snapshot = await getDocs(periodQuery);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DetailedOrder[];

      if (orders.length === 0) {
        return null;
      }

      // Calculate analytics
      const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalSales / totalOrders;
      const totalProfit = orders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + item.profitMargin, 0), 0
      );

      // Get top selling items
      const itemSales: { [key: string]: any } = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemSales[item.menuItemId]) {
            itemSales[item.menuItemId] = {
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              quantitySold: 0,
              revenue: 0,
              profit: 0,
              season: order.seasonalData.season
            };
          }
          itemSales[item.menuItemId].quantitySold += item.quantity;
          itemSales[item.menuItemId].revenue += item.subtotal;
          itemSales[item.menuItemId].profit += item.profitMargin;
        });
      });

      const topSellingItems = Object.values(itemSales)
        .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
        .slice(0, 10);

      const analytics: SalesAnalytics = {
        karenderiaId,
        period,
        date: new Date(),
        totalSales,
        totalOrders,
        averageOrderValue,
        totalProfit,
        topSellingItems,
        salesByTimeOfDay: this.calculateSalesByTimeOfDay(orders),
        seasonalTrends: this.calculateSeasonalTrends(orders)
      };

      this.analyticsSubject.next(analytics);
      return analytics;

    } catch (error) {
      console.error('Error getting sales analytics:', error);
      return null;
    }
  }

  private calculateSalesByTimeOfDay(orders: DetailedOrder[]) {
    const timeSlots = ['breakfast', 'lunch', 'merienda', 'dinner', 'late-night'];
    return timeSlots.map(timeSlot => {
      const slotOrders = orders.filter(order => order.seasonalData.timeOfDay === timeSlot);
      return {
        timeSlot,
        orderCount: slotOrders.length,
        revenue: slotOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      };
    });
  }

  private calculateSeasonalTrends(orders: DetailedOrder[]) {
    const seasons = ['dry', 'wet', 'summer', 'christmas'];
    return seasons.map(season => {
      const seasonOrders = orders.filter(order => order.seasonalData.season === season);
      const itemPerformance: { [key: string]: any } = {};

      seasonOrders.forEach(order => {
        order.items.forEach(item => {
          if (!itemPerformance[item.menuItemId]) {
            itemPerformance[item.menuItemId] = {
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              quantitySold: 0,
              revenueGenerated: 0,
              customerRating: 0,
              trending: 'stable' as 'up' | 'down' | 'stable'
            };
          }
          itemPerformance[item.menuItemId].quantitySold += item.quantity;
          itemPerformance[item.menuItemId].revenueGenerated += item.subtotal;
        });
      });

      return {
        season,
        itemPerformance: Object.values(itemPerformance)
      };
    });
  }

  private async updateDailyAnalytics(order: DetailedOrder): Promise<void> {
    // Update or create daily analytics record
    // This would typically aggregate data for dashboard display
  }

  private async loadOrders(): Promise<void> {
    // Load recent orders for display
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
