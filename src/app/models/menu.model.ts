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
