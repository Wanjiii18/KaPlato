export interface Ingredient {
  id: string;
  name: string;
  cost: number; // PHP
  unit: string; // kg, pieces, grams, etc.
  stock: number;
  minimumStock: number;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // PHP
  category: string;
  image?: string;
  ingredients: MenuIngredient[];
  preparationTime: number; // minutes
  isAvailable: boolean;
  isPopular: boolean;
  allergens: string[];
  stock?: number; // Add stock property for inventory tracking
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number; // PHP
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number; // PHP
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'gcash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedReadyTime?: Date;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number; // PHP
  specialInstructions?: string;
  subtotal: number; // PHP
}

export interface DailySales {
  date: Date;
  totalSales: number; // PHP
  totalOrders: number;
  popularItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number; // PHP
  }[];
}

// Enhanced Order tracking for analytics
export interface DetailedOrder {
  id?: string;
  orderNumber: string; // e.g., "KP-2025-001234"
  karenderiaId: string;
  items: DetailedOrderItem[];
  
  // Customer Information
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  
  // Financial Details
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'gcash' | 'maya';
  
  // Operational Details
  orderStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  placedAt: Date;
  preparedAt?: Date;
  completedAt?: Date;
  
  // Analytics Data
  seasonalData: {
    season: 'dry' | 'wet' | 'summer' | 'christmas'; // Philippine seasons
    month: number;
    dayOfWeek: number;
    timeOfDay: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'late-night';
    weatherCondition?: 'sunny' | 'rainy' | 'cloudy';
  };
  
  // Performance Metrics
  preparationTimeActual?: number; // minutes
  customerSatisfaction?: number; // 1-5 rating
  notes?: string;
}

export interface DetailedOrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  
  // Cost Analysis
  ingredientCost: number; // Total cost of ingredients
  profitMargin: number; // subtotal - ingredientCost
  
  // Customizations
  specialInstructions?: string;
  modifications?: string[]; // e.g., "extra rice", "no onions"
  
  // Analytics
  preparationTime: number; // Expected prep time
  popularityScore?: number; // Based on frequency ordered
}

// Sales Analytics Interface
export interface SalesAnalytics {
  id?: string;
  karenderiaId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  
  // Financial Metrics
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProfit: number;
  
  // Popular Items by Season
  topSellingItems: {
    menuItemId: string;
    menuItemName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
    season: string;
  }[];
  
  // Performance by Time
  salesByTimeOfDay: {
    timeSlot: string;
    orderCount: number;
    revenue: number;
  }[];
  
  // Seasonal Trends
  seasonalTrends: {
    season: string;
    itemPerformance: {
      menuItemId: string;
      menuItemName: string;
      quantitySold: number;
      revenueGenerated: number;
      customerRating: number;
      trending: 'up' | 'down' | 'stable';
    }[];
  }[];
}
