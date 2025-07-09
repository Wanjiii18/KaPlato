import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { MenuItem, Ingredient, MenuCategory, Order, DailySales } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  private categoriesSubject = new BehaviorSubject<MenuCategory[]>([]);
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  menuItems$ = this.menuItemsSubject.asObservable();
  ingredients$ = this.ingredientsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.loadCategories();
    this.loadIngredients();
    this.loadMenuItems();
    this.loadOrders();
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
      const menuItemsRef = collection(this.firestore, 'menuItems');
      const q = query(menuItemsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const menuItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      
      this.menuItemsSubject.next(menuItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  }

  async addMenuItem(menuItem: Partial<MenuItem>): Promise<string> {
    const menuItemsRef = collection(this.firestore, 'menuItems');
    const docRef = await addDoc(menuItemsRef, {
      ...menuItem,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.loadMenuItems();
    return docRef.id;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    const menuItemRef = doc(this.firestore, 'menuItems', id);
    await updateDoc(menuItemRef, {
      ...updates,
      updatedAt: new Date()
    });
    this.loadMenuItems();
  }

  async deleteMenuItem(id: string): Promise<void> {
    const menuItemRef = doc(this.firestore, 'menuItems', id);
    await deleteDoc(menuItemRef);
    this.loadMenuItems();
  }

  // INGREDIENTS
  async loadIngredients(): Promise<void> {
    try {
      const ingredientsRef = collection(this.firestore, 'ingredients');
      const q = query(ingredientsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const ingredients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[];
      
      this.ingredientsSubject.next(ingredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<string> {
    const ingredientsRef = collection(this.firestore, 'ingredients');
    const docRef = await addDoc(ingredientsRef, {
      ...ingredient,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.loadIngredients();
    return docRef.id;
  }

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    const ingredientRef = doc(this.firestore, 'ingredients', id);
    await updateDoc(ingredientRef, {
      ...updates,
      updatedAt: new Date()
    });
    this.loadIngredients();
  }

  async deleteIngredient(id: string): Promise<void> {
    const ingredientRef = doc(this.firestore, 'ingredients', id);
    await deleteDoc(ingredientRef);
    this.loadIngredients();
  }

  // CATEGORIES
  async loadCategories(): Promise<void> {
    try {
      const categoriesRef = collection(this.firestore, 'menuCategories');
      const q = query(categoriesRef, orderBy('order'));
      const snapshot = await getDocs(q);
      
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuCategory[];
      
      this.categoriesSubject.next(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async addCategory(category: Omit<MenuCategory, 'id'>): Promise<string> {
    const categoriesRef = collection(this.firestore, 'menuCategories');
    const docRef = await addDoc(categoriesRef, category);
    this.loadCategories();
    return docRef.id;
  }

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<void> {
    const categoryRef = doc(this.firestore, 'menuCategories', id);
    await updateDoc(categoryRef, updates);
    this.loadCategories();
  }

  async deleteCategory(id: string): Promise<void> {
    const categoryRef = doc(this.firestore, 'menuCategories', id);
    await deleteDoc(categoryRef);
    this.loadCategories();
  }

  // ORDERS
  async loadOrders(): Promise<void> {
    try {
      const ordersRef = collection(this.firestore, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      this.ordersSubject.next(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const orderRef = doc(this.firestore, 'orders', id);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date()
    });
    this.loadOrders();
  }

  // ANALYTICS
  async getDailySales(date: Date): Promise<DailySales> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const ordersRef = collection(this.firestore, 'orders');
    const q = query(
      ordersRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay),
      where('status', '!=', 'cancelled')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data()) as Order[];
    
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    
    // Calculate popular items
    const itemCounts = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (itemCounts.has(item.menuItemId)) {
          const existing = itemCounts.get(item.menuItemId)!;
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          itemCounts.set(item.menuItemId, {
            name: item.menuItemName,
            quantity: item.quantity,
            revenue: item.subtotal
          });
        }
      });
    });
    
    const popularItems = Array.from(itemCounts.entries())
      .map(([itemId, data]) => ({
        itemId,
        itemName: data.name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    return {
      date,
      totalSales,
      totalOrders,
      popularItems
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
