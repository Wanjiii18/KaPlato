import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SalesAnalytics {
  period: string;
  total_sales: number;
  total_orders: number;
  total_profit: number;
  average_order_value: number;
  best_selling_items: {
    item_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
  }[];
  hourly_sales: {
    hour: number;
    sales: number;
    orders: number;
  }[];
  daily_sales: {
    date: string;
    sales: number;
    orders: number;
    profit: number;
  }[];
  customer_analytics: {
    new_customers: number;
    returning_customers: number;
    customer_retention_rate: number;
  };
}

export interface IngredientUsageAnalytics {
  ingredient_name: string;
  total_used: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  dishes_used_in: string[];
  usage_trend: 'increasing' | 'stable' | 'decreasing';
  waste_percentage: number;
  supplier: string;
  seasonal_pattern?: {
    month: string;
    usage: number;
  }[];
}

export interface FinancialAnalytics {
  revenue: {
    gross_revenue: number;
    net_revenue: number;
    revenue_growth: number;
  };
  costs: {
    ingredient_costs: number;
    labor_costs: number;
    overhead_costs: number;
    total_costs: number;
  };
  profit: {
    gross_profit: number;
    net_profit: number;
    profit_margin: number;
    profit_growth: number;
  };
  cash_flow: {
    cash_in: number;
    cash_out: number;
    net_cash_flow: number;
  };
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers_this_period: number;
  returning_customers: number;
  customer_retention_rate: number;
  average_customer_lifetime_value: number;
  top_customers: {
    customer_name: string;
    total_orders: number;
    total_spent: number;
    last_order_date: Date;
  }[];
  customer_segments: {
    segment: string;
    count: number;
    percentage: number;
    avg_order_value: number;
  }[];
}

export interface OperationalAnalytics {
  order_fulfillment: {
    average_preparation_time: number;
    order_completion_rate: number;
    on_time_delivery_rate: number;
  };
  peak_hours: {
    hour: number;
    order_count: number;
    revenue: number;
  }[];
  staff_productivity: {
    orders_per_hour: number;
    revenue_per_staff: number;
    efficiency_score: number;
  };
  waste_analytics: {
    total_waste_cost: number;
    waste_percentage: number;
    most_wasted_items: string[];
  };
}

export interface PredictiveAnalytics {
  demand_forecast: {
    item_name: string;
    predicted_demand: number;
    confidence_level: number;
    recommended_prep_quantity: number;
  }[];
  revenue_forecast: {
    next_week: number;
    next_month: number;
    confidence_level: number;
  };
  inventory_predictions: {
    item_name: string;
    days_until_stockout: number;
    recommended_reorder_date: Date;
    suggested_quantity: number;
  }[];
  seasonal_trends: {
    season: string;
    expected_sales_change: number;
    recommended_menu_items: string[];
  }[];
}

export interface BusinessInsights {
  key_metrics: {
    metric: string;
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
  }[];
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimated_impact: string;
    action_items: string[];
  }[];
  alerts: {
    type: 'opportunity' | 'risk' | 'maintenance';
    title: string;
    message: string;
    urgency: 'high' | 'medium' | 'low';
    created_at: Date;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {
  private apiUrl = environment.apiUrl;
  
  private salesAnalyticsSubject = new BehaviorSubject<SalesAnalytics | null>(null);
  private ingredientAnalyticsSubject = new BehaviorSubject<IngredientUsageAnalytics[]>([]);
  private financialAnalyticsSubject = new BehaviorSubject<FinancialAnalytics | null>(null);
  private customerAnalyticsSubject = new BehaviorSubject<CustomerAnalytics | null>(null);
  private operationalAnalyticsSubject = new BehaviorSubject<OperationalAnalytics | null>(null);
  private predictiveAnalyticsSubject = new BehaviorSubject<PredictiveAnalytics | null>(null);
  private businessInsightsSubject = new BehaviorSubject<BusinessInsights | null>(null);

  salesAnalytics$ = this.salesAnalyticsSubject.asObservable();
  ingredientAnalytics$ = this.ingredientAnalyticsSubject.asObservable();
  financialAnalytics$ = this.financialAnalyticsSubject.asObservable();
  customerAnalytics$ = this.customerAnalyticsSubject.asObservable();
  operationalAnalytics$ = this.operationalAnalyticsSubject.asObservable();
  predictiveAnalytics$ = this.predictiveAnalyticsSubject.asObservable();
  businessInsights$ = this.businessInsightsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAllAnalytics('today');
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // MAIN ANALYTICS LOADING

  /**
   * Load all analytics for a given period
   */
  async loadAllAnalytics(period: string = 'today'): Promise<void> {
    await Promise.all([
      this.loadSalesAnalytics(period),
      this.loadIngredientAnalytics(period),
      this.loadFinancialAnalytics(period),
      this.loadCustomerAnalytics(period),
      this.loadOperationalAnalytics(period),
      this.loadPredictiveAnalytics(),
      this.generateBusinessInsights()
    ]);
  }

  // SALES ANALYTICS

  /**
   * Load sales analytics
   */
  async loadSalesAnalytics(period: string): Promise<void> {
    try {
      const response = await this.http.get<{ data: SalesAnalytics }>(`${this.apiUrl}/analytics/sales`, {
        headers: this.getHeaders(),
        params: { period }
      }).toPromise();

      if (response?.data) {
        this.salesAnalyticsSubject.next(response.data);
      } else {
        // Generate mock data for development
        this.generateMockSalesAnalytics(period);
      }
    } catch (error) {
      console.error('Error loading sales analytics:', error);
      this.generateMockSalesAnalytics(period);
    }
  }

  /**
   * Get sales comparison data
   */
  async getSalesComparison(currentPeriod: string, previousPeriod: string): Promise<{
    current: SalesAnalytics;
    previous: SalesAnalytics;
    growth: {
      sales_growth: number;
      order_growth: number;
      profit_growth: number;
    };
  } | null> {
    try {
      const [current, previous] = await Promise.all([
        this.http.get<{ data: SalesAnalytics }>(`${this.apiUrl}/analytics/sales`, {
          headers: this.getHeaders(),
          params: { period: currentPeriod }
        }).toPromise(),
        this.http.get<{ data: SalesAnalytics }>(`${this.apiUrl}/analytics/sales`, {
          headers: this.getHeaders(),
          params: { period: previousPeriod }
        }).toPromise()
      ]);

      if (current?.data && previous?.data) {
        return {
          current: current.data,
          previous: previous.data,
          growth: {
            sales_growth: ((current.data.total_sales - previous.data.total_sales) / previous.data.total_sales) * 100,
            order_growth: ((current.data.total_orders - previous.data.total_orders) / previous.data.total_orders) * 100,
            profit_growth: ((current.data.total_profit - previous.data.total_profit) / previous.data.total_profit) * 100
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting sales comparison:', error);
      return null;
    }
  }

  // INGREDIENT USAGE ANALYTICS

  /**
   * Load ingredient usage analytics
   */
  async loadIngredientAnalytics(period: string): Promise<void> {
    try {
      const response = await this.http.get<{ data: IngredientUsageAnalytics[] }>(`${this.apiUrl}/analytics/ingredients`, {
        headers: this.getHeaders(),
        params: { period }
      }).toPromise();

      if (response?.data) {
        this.ingredientAnalyticsSubject.next(response.data);
      } else {
        this.generateMockIngredientAnalytics();
      }
    } catch (error) {
      console.error('Error loading ingredient analytics:', error);
      this.generateMockIngredientAnalytics();
    }
  }

  /**
   * Get ingredient cost optimization suggestions
   */
  getIngredientOptimizationSuggestions(): {
    high_cost_items: string[];
    waste_reduction_opportunities: string[];
    supplier_optimization: string[];
    seasonal_recommendations: string[];
  } {
    const ingredients = this.ingredientAnalyticsSubject.getValue();
    
    const highCostItems = ingredients
      .filter(i => i.total_cost > 1000)
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 5)
      .map(i => i.ingredient_name);

    const wasteReduction = ingredients
      .filter(i => i.waste_percentage > 10)
      .sort((a, b) => b.waste_percentage - a.waste_percentage)
      .slice(0, 3)
      .map(i => i.ingredient_name);

    return {
      high_cost_items: highCostItems,
      waste_reduction_opportunities: wasteReduction,
      supplier_optimization: ['Consider bulk purchasing for frequently used items'],
      seasonal_recommendations: ['Focus on seasonal vegetables for cost savings']
    };
  }

  // FINANCIAL ANALYTICS

  /**
   * Load financial analytics
   */
  async loadFinancialAnalytics(period: string): Promise<void> {
    try {
      const response = await this.http.get<{ data: FinancialAnalytics }>(`${this.apiUrl}/analytics/financial`, {
        headers: this.getHeaders(),
        params: { period }
      }).toPromise();

      if (response?.data) {
        this.financialAnalyticsSubject.next(response.data);
      } else {
        this.generateMockFinancialAnalytics();
      }
    } catch (error) {
      console.error('Error loading financial analytics:', error);
      this.generateMockFinancialAnalytics();
    }
  }

  // CUSTOMER ANALYTICS

  /**
   * Load customer analytics
   */
  async loadCustomerAnalytics(period: string): Promise<void> {
    try {
      const response = await this.http.get<{ data: CustomerAnalytics }>(`${this.apiUrl}/analytics/customers`, {
        headers: this.getHeaders(),
        params: { period }
      }).toPromise();

      if (response?.data) {
        this.customerAnalyticsSubject.next(response.data);
      } else {
        this.generateMockCustomerAnalytics();
      }
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      this.generateMockCustomerAnalytics();
    }
  }

  // OPERATIONAL ANALYTICS

  /**
   * Load operational analytics
   */
  async loadOperationalAnalytics(period: string): Promise<void> {
    try {
      const response = await this.http.get<{ data: OperationalAnalytics }>(`${this.apiUrl}/analytics/operations`, {
        headers: this.getHeaders(),
        params: { period }
      }).toPromise();

      if (response?.data) {
        this.operationalAnalyticsSubject.next(response.data);
      } else {
        this.generateMockOperationalAnalytics();
      }
    } catch (error) {
      console.error('Error loading operational analytics:', error);
      this.generateMockOperationalAnalytics();
    }
  }

  // PREDICTIVE ANALYTICS

  /**
   * Load predictive analytics
   */
  async loadPredictiveAnalytics(): Promise<void> {
    try {
      const response = await this.http.get<{ data: PredictiveAnalytics }>(`${this.apiUrl}/analytics/predictive`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.predictiveAnalyticsSubject.next(response.data);
      } else {
        this.generateMockPredictiveAnalytics();
      }
    } catch (error) {
      console.error('Error loading predictive analytics:', error);
      this.generateMockPredictiveAnalytics();
    }
  }

  // BUSINESS INSIGHTS

  /**
   * Generate business insights based on all analytics
   */
  async generateBusinessInsights(): Promise<void> {
    const salesData = this.salesAnalyticsSubject.getValue();
    const financialData = this.financialAnalyticsSubject.getValue();
    const operationalData = this.operationalAnalyticsSubject.getValue();

    const insights: BusinessInsights = {
      key_metrics: this.generateKeyMetrics(salesData, financialData),
      recommendations: this.generateRecommendations(salesData, financialData, operationalData),
      alerts: this.generateAlerts(salesData, financialData, operationalData)
    };

    this.businessInsightsSubject.next(insights);
  }

  // UTILITY METHODS

  /**
   * Format currency
   */
  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Get period display name
   */
  getPeriodDisplayName(period: string): string {
    const periodMap: { [key: string]: string } = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this_week': 'This Week',
      'last_week': 'Last Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'this_year': 'This Year'
    };
    return periodMap[period] || period;
  }

  // MOCK DATA GENERATORS (for development)

  private generateMockSalesAnalytics(period: string): void {
    const mockData: SalesAnalytics = {
      period,
      total_sales: 15750.00,
      total_orders: 47,
      total_profit: 6300.00,
      average_order_value: 335.11,
      best_selling_items: [
        { item_name: 'Adobong Manok', quantity_sold: 15, revenue: 1800.00, profit: 750.00 },
        { item_name: 'Sinigang na Baboy', quantity_sold: 12, revenue: 1800.00, profit: 720.00 },
        { item_name: 'Pancit Canton', quantity_sold: 18, revenue: 1800.00, profit: 900.00 }
      ],
      hourly_sales: Array.from({ length: 12 }, (_, i) => ({
        hour: i + 8,
        sales: Math.random() * 2000 + 500,
        orders: Math.floor(Math.random() * 8) + 2
      })),
      daily_sales: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.random() * 3000 + 1000,
        orders: Math.floor(Math.random() * 15) + 5,
        profit: Math.random() * 1200 + 400
      })),
      customer_analytics: {
        new_customers: 8,
        returning_customers: 23,
        customer_retention_rate: 74.2
      }
    };

    this.salesAnalyticsSubject.next(mockData);
  }

  private generateMockIngredientAnalytics(): void {
    const mockData: IngredientUsageAnalytics[] = [
      {
        ingredient_name: 'Chicken',
        total_used: 25.5,
        unit: 'kg',
        cost_per_unit: 180.00,
        total_cost: 4590.00,
        dishes_used_in: ['Adobong Manok', 'Chicken Curry', 'Fried Chicken'],
        usage_trend: 'increasing',
        waste_percentage: 5.2,
        supplier: 'Fresh Market Supply Co.'
      },
      {
        ingredient_name: 'Rice',
        total_used: 45.0,
        unit: 'kg',
        cost_per_unit: 65.00,
        total_cost: 2925.00,
        dishes_used_in: ['All dishes'],
        usage_trend: 'stable',
        waste_percentage: 2.1,
        supplier: 'Metro Food Distributors'
      }
    ];

    this.ingredientAnalyticsSubject.next(mockData);
  }

  private generateMockFinancialAnalytics(): void {
    const mockData: FinancialAnalytics = {
      revenue: {
        gross_revenue: 15750.00,
        net_revenue: 14175.00,
        revenue_growth: 12.5
      },
      costs: {
        ingredient_costs: 6300.00,
        labor_costs: 2100.00,
        overhead_costs: 1575.00,
        total_costs: 9975.00
      },
      profit: {
        gross_profit: 9450.00,
        net_profit: 4200.00,
        profit_margin: 26.7,
        profit_growth: 8.3
      },
      cash_flow: {
        cash_in: 14175.00,
        cash_out: 9975.00,
        net_cash_flow: 4200.00
      }
    };

    this.financialAnalyticsSubject.next(mockData);
  }

  private generateMockCustomerAnalytics(): void {
    const mockData: CustomerAnalytics = {
      total_customers: 156,
      new_customers_this_period: 23,
      returning_customers: 133,
      customer_retention_rate: 85.3,
      average_customer_lifetime_value: 2450.00,
      top_customers: [
        { customer_name: 'Maria Santos', total_orders: 24, total_spent: 8950.00, last_order_date: new Date() },
        { customer_name: 'Juan Dela Cruz', total_orders: 18, total_spent: 6720.00, last_order_date: new Date() }
      ],
      customer_segments: [
        { segment: 'Regular', count: 98, percentage: 62.8, avg_order_value: 340.00 },
        { segment: 'Occasional', count: 47, percentage: 30.1, avg_order_value: 285.00 },
        { segment: 'New', count: 11, percentage: 7.1, avg_order_value: 425.00 }
      ]
    };

    this.customerAnalyticsSubject.next(mockData);
  }

  private generateMockOperationalAnalytics(): void {
    const mockData: OperationalAnalytics = {
      order_fulfillment: {
        average_preparation_time: 22.5,
        order_completion_rate: 96.8,
        on_time_delivery_rate: 92.3
      },
      peak_hours: [
        { hour: 12, order_count: 8, revenue: 2640.00 },
        { hour: 18, order_count: 12, revenue: 3960.00 },
        { hour: 19, order_count: 9, revenue: 2970.00 }
      ],
      staff_productivity: {
        orders_per_hour: 3.2,
        revenue_per_staff: 5250.00,
        efficiency_score: 87.5
      },
      waste_analytics: {
        total_waste_cost: 315.00,
        waste_percentage: 4.8,
        most_wasted_items: ['Vegetables', 'Bread', 'Milk']
      }
    };

    this.operationalAnalyticsSubject.next(mockData);
  }

  private generateMockPredictiveAnalytics(): void {
    const mockData: PredictiveAnalytics = {
      demand_forecast: [
        { item_name: 'Adobong Manok', predicted_demand: 18, confidence_level: 87.5, recommended_prep_quantity: 20 },
        { item_name: 'Sinigang na Baboy', predicted_demand: 14, confidence_level: 82.3, recommended_prep_quantity: 16 }
      ],
      revenue_forecast: {
        next_week: 18500.00,
        next_month: 78000.00,
        confidence_level: 78.9
      },
      inventory_predictions: [
        { item_name: 'Chicken', days_until_stockout: 8, recommended_reorder_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), suggested_quantity: 30 }
      ],
      seasonal_trends: [
        { season: 'Summer', expected_sales_change: 15.2, recommended_menu_items: ['Cold dishes', 'Refreshing drinks'] }
      ]
    };

    this.predictiveAnalyticsSubject.next(mockData);
  }

  private generateKeyMetrics(sales: SalesAnalytics | null, financial: FinancialAnalytics | null): BusinessInsights['key_metrics'] {
    if (!sales || !financial) return [];

    return [
      {
        metric: 'Revenue',
        current_value: sales.total_sales,
        previous_value: sales.total_sales * 0.92,
        change_percentage: 8.7,
        trend: 'up',
        status: 'good'
      },
      {
        metric: 'Profit Margin',
        current_value: financial.profit.profit_margin,
        previous_value: 24.2,
        change_percentage: 2.5,
        trend: 'up',
        status: 'good'
      }
    ];
  }

  private generateRecommendations(sales: SalesAnalytics | null, financial: FinancialAnalytics | null, operational: OperationalAnalytics | null): BusinessInsights['recommendations'] {
    return [
      {
        category: 'Menu Optimization',
        title: 'Promote Best Sellers',
        description: 'Focus marketing efforts on your top-performing dishes to maximize revenue',
        priority: 'high',
        estimated_impact: '15-20% revenue increase',
        action_items: ['Create special promotions', 'Feature prominently on menu', 'Offer combo deals']
      },
      {
        category: 'Cost Management',
        title: 'Reduce Food Waste',
        description: 'Implement better inventory tracking to minimize waste and improve profit margins',
        priority: 'medium',
        estimated_impact: '5-8% cost reduction',
        action_items: ['Track daily waste', 'Adjust portion sizes', 'Improve storage methods']
      }
    ];
  }

  private generateAlerts(sales: SalesAnalytics | null, financial: FinancialAnalytics | null, operational: OperationalAnalytics | null): BusinessInsights['alerts'] {
    return [
      {
        type: 'opportunity',
        title: 'Peak Hour Optimization',
        message: 'You have high demand during lunch and dinner. Consider increasing staff during these periods.',
        urgency: 'medium',
        created_at: new Date()
      }
    ];
  }
}
