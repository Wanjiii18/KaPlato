import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  id?: number;
  karenderia_id?: number;
  item_name: string;
  description: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_cost: number;
  total_value: number;
  supplier?: string;
  supplier_contact?: string;
  last_restocked?: Date;
  expiry_date?: Date;
  batch_number?: string;
  storage_location?: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired' | 'discontinued';
  created_at?: Date;
  updated_at?: Date;
}

export interface InventoryAlert {
  id: number;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock';
  item_name: string;
  current_stock: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action_required: string;
  created_at: Date;
}

export interface Supplier {
  id?: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  delivery_days: string[];
  minimum_order: number;
  rating: number;
  items_supplied: string[];
  notes?: string;
  active: boolean;
}

export interface StockMovement {
  id?: number;
  inventory_item_id: number;
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  unit_cost?: number;
  reason: string;
  reference_number?: string;
  user_id: number;
  created_at: Date;
  running_balance: number;
}

export interface InventoryReport {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_items: number;
  turnover_rate: number;
  top_moving_items: {
    item_name: string;
    usage_rate: number;
    value: number;
  }[];
  cost_analysis: {
    category: string;
    total_cost: number;
    percentage: number;
  }[];
}

export interface RestockSuggestion {
  item_name: string;
  current_stock: number;
  suggested_quantity: number;
  estimated_cost: number;
  supplier: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  days_until_stockout: number;
  usage_trend: 'increasing' | 'stable' | 'decreasing';
}

@Injectable({
  providedIn: 'root'
})
export class InventoryManagementService {
  private apiUrl = environment.apiUrl;
  
  private inventoryItemsSubject = new BehaviorSubject<InventoryItem[]>([]);
  private inventoryAlertsSubject = new BehaviorSubject<InventoryAlert[]>([]);
  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  private stockMovementsSubject = new BehaviorSubject<StockMovement[]>([]);

  inventoryItems$ = this.inventoryItemsSubject.asObservable();
  inventoryAlerts$ = this.inventoryAlertsSubject.asObservable();
  suppliers$ = this.suppliersSubject.asObservable();
  stockMovements$ = this.stockMovementsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInventoryItems();
    this.loadSuppliers();
    this.loadInventoryAlerts();
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // INVENTORY ITEMS MANAGEMENT

  /**
   * Load all inventory items
   */
  async loadInventoryItems(): Promise<void> {
    try {
      const response = await this.http.get<{ data: InventoryItem[] }>(`${this.apiUrl}/inventory`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.inventoryItemsSubject.next(response.data);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
    }
  }

  /**
   * Add new inventory item
   */
  async addInventoryItem(item: InventoryItem): Promise<InventoryItem | null> {
    try {
      // Auto-calculate total value
      item.total_value = item.current_stock * item.unit_cost;
      
      // Auto-determine status
      item.status = this.determineItemStatus(item);

      const response = await this.http.post<{ data: InventoryItem }>(`${this.apiUrl}/inventory`, item, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        const currentItems = this.inventoryItemsSubject.getValue();
        this.inventoryItemsSubject.next([...currentItems, response.data]);
        this.checkInventoryAlerts();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return null;
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(item: InventoryItem): Promise<boolean> {
    try {
      // Recalculate total value and status
      item.total_value = item.current_stock * item.unit_cost;
      item.status = this.determineItemStatus(item);

      const response = await this.http.put(`${this.apiUrl}/inventory/${item.id}`, item, {
        headers: this.getHeaders()
      }).toPromise();

      const currentItems = this.inventoryItemsSubject.getValue();
      const index = currentItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        currentItems[index] = item;
        this.inventoryItemsSubject.next([...currentItems]);
        this.checkInventoryAlerts();
      }
      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return false;
    }
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(itemId: number): Promise<boolean> {
    try {
      await this.http.delete(`${this.apiUrl}/inventory/${itemId}`, {
        headers: this.getHeaders()
      }).toPromise();

      const currentItems = this.inventoryItemsSubject.getValue();
      this.inventoryItemsSubject.next(currentItems.filter(i => i.id !== itemId));
      this.checkInventoryAlerts();
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  /**
   * Update stock quantity (for stock in/out operations)
   */
  async updateStock(itemId: number, newQuantity: number, movementType: StockMovement['type'], reason: string): Promise<boolean> {
    try {
      const currentItems = this.inventoryItemsSubject.getValue();
      const item = currentItems.find(i => i.id === itemId);
      
      if (!item) return false;

      const oldQuantity = item.current_stock;
      const quantityChange = newQuantity - oldQuantity;

      // Record stock movement
      const movement: StockMovement = {
        inventory_item_id: itemId,
        type: movementType,
        quantity: Math.abs(quantityChange),
        reason,
        user_id: 1, // Get from auth service
        created_at: new Date(),
        running_balance: newQuantity
      };

      await this.recordStockMovement(movement);

      // Update item
      item.current_stock = newQuantity;
      item.total_value = newQuantity * item.unit_cost;
      item.status = this.determineItemStatus(item);

      if (movementType === 'in') {
        item.last_restocked = new Date();
      }

      return await this.updateInventoryItem(item);
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  }

  /**
   * Bulk stock update from CSV or manual input
   */
  async bulkUpdateStock(updates: { itemId: number; newQuantity: number; reason: string }[]): Promise<boolean> {
    try {
      let allSuccess = true;

      for (const update of updates) {
        const success = await this.updateStock(update.itemId, update.newQuantity, 'adjustment', update.reason);
        if (!success) allSuccess = false;
      }

      return allSuccess;
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      return false;
    }
  }

  // INVENTORY ALERTS

  /**
   * Check and generate inventory alerts
   */
  private async checkInventoryAlerts(): Promise<void> {
    const items = this.inventoryItemsSubject.getValue();
    const alerts: InventoryAlert[] = [];

    items.forEach((item, index) => {
      // Low stock alert
      if (item.current_stock <= item.minimum_stock && item.current_stock > 0) {
        alerts.push({
          id: index + 1,
          type: 'low_stock',
          item_name: item.item_name,
          current_stock: item.current_stock,
          threshold: item.minimum_stock,
          severity: item.current_stock <= (item.minimum_stock * 0.5) ? 'high' : 'medium',
          message: `${item.item_name} is running low (${item.current_stock} ${item.unit} remaining)`,
          action_required: 'Reorder stock soon',
          created_at: new Date()
        });
      }

      // Out of stock alert
      if (item.current_stock <= 0) {
        alerts.push({
          id: index + 1000,
          type: 'out_of_stock',
          item_name: item.item_name,
          current_stock: item.current_stock,
          threshold: 0,
          severity: 'critical',
          message: `${item.item_name} is out of stock`,
          action_required: 'Reorder immediately',
          created_at: new Date()
        });
      }

      // Overstock alert
      if (item.current_stock > item.maximum_stock) {
        alerts.push({
          id: index + 2000,
          type: 'overstock',
          item_name: item.item_name,
          current_stock: item.current_stock,
          threshold: item.maximum_stock,
          severity: 'low',
          message: `${item.item_name} is overstocked (${item.current_stock} ${item.unit})`,
          action_required: 'Consider reducing orders or promoting item',
          created_at: new Date()
        });
      }

      // Expiring soon alert
      if (item.expiry_date) {
        const daysUntilExpiry = this.getDaysUntilExpiry(item.expiry_date);
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          alerts.push({
            id: index + 3000,
            type: 'expiring_soon',
            item_name: item.item_name,
            current_stock: item.current_stock,
            threshold: 7,
            severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
            message: `${item.item_name} expires in ${daysUntilExpiry} days`,
            action_required: 'Use soon or mark for clearance',
            created_at: new Date()
          });
        }

        // Expired alert
        if (daysUntilExpiry <= 0) {
          alerts.push({
            id: index + 4000,
            type: 'expired',
            item_name: item.item_name,
            current_stock: item.current_stock,
            threshold: 0,
            severity: 'critical',
            message: `${item.item_name} has expired`,
            action_required: 'Remove from inventory immediately',
            created_at: new Date()
          });
        }
      }
    });

    this.inventoryAlertsSubject.next(alerts);
  }

  /**
   * Load inventory alerts
   */
  async loadInventoryAlerts(): Promise<void> {
    await this.checkInventoryAlerts();
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: number): void {
    const currentAlerts = this.inventoryAlertsSubject.getValue();
    this.inventoryAlertsSubject.next(currentAlerts.filter(a => a.id !== alertId));
  }

  // SUPPLIERS MANAGEMENT

  /**
   * Load suppliers
   */
  async loadSuppliers(): Promise<void> {
    try {
      const response = await this.http.get<{ data: Supplier[] }>(`${this.apiUrl}/suppliers`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.suppliersSubject.next(response.data);
      } else {
        // Load default suppliers if none exist
        this.loadDefaultSuppliers();
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      this.loadDefaultSuppliers();
    }
  }

  /**
   * Add supplier
   */
  async addSupplier(supplier: Supplier): Promise<boolean> {
    try {
      const response = await this.http.post<{ data: Supplier }>(`${this.apiUrl}/suppliers`, supplier, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        const currentSuppliers = this.suppliersSubject.getValue();
        this.suppliersSubject.next([...currentSuppliers, response.data]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding supplier:', error);
      return false;
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(supplier: Supplier): Promise<boolean> {
    try {
      await this.http.put(`${this.apiUrl}/suppliers/${supplier.id}`, supplier, {
        headers: this.getHeaders()
      }).toPromise();

      const currentSuppliers = this.suppliersSubject.getValue();
      const index = currentSuppliers.findIndex(s => s.id === supplier.id);
      if (index !== -1) {
        currentSuppliers[index] = supplier;
        this.suppliersSubject.next([...currentSuppliers]);
      }
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  }

  // STOCK MOVEMENTS

  /**
   * Record stock movement
   */
  async recordStockMovement(movement: StockMovement): Promise<boolean> {
    try {
      const response = await this.http.post<{ data: StockMovement }>(`${this.apiUrl}/stock-movements`, movement, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        const currentMovements = this.stockMovementsSubject.getValue();
        this.stockMovementsSubject.next([response.data, ...currentMovements]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      return false;
    }
  }

  /**
   * Get stock movements for an item
   */
  getStockMovements(itemId: number): Observable<{ data: StockMovement[] }> {
    return this.http.get<{ data: StockMovement[] }>(`${this.apiUrl}/stock-movements/${itemId}`, {
      headers: this.getHeaders()
    });
  }

  // REPORTS AND ANALYTICS

  /**
   * Generate inventory report
   */
  async generateInventoryReport(): Promise<InventoryReport> {
    const items = this.inventoryItemsSubject.getValue();
    const alerts = this.inventoryAlertsSubject.getValue();

    const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);
    const lowStockCount = alerts.filter(a => a.type === 'low_stock').length;
    const outOfStockCount = alerts.filter(a => a.type === 'out_of_stock').length;
    const expiringCount = alerts.filter(a => a.type === 'expiring_soon').length;

    // Calculate category costs
    const categoryTotals: { [category: string]: number } = {};
    items.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.total_value;
    });

    const costAnalysis = Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total_cost: total,
      percentage: (total / totalValue) * 100
    })).sort((a, b) => b.total_cost - a.total_cost);

    return {
      total_items: items.length,
      total_value: totalValue,
      low_stock_items: lowStockCount,
      out_of_stock_items: outOfStockCount,
      expiring_items: expiringCount,
      turnover_rate: 0, // Would need sales data to calculate
      top_moving_items: [], // Would need movement data
      cost_analysis: costAnalysis
    };
  }

  /**
   * Get restock suggestions
   */
  getRestockSuggestions(): RestockSuggestion[] {
    const items = this.inventoryItemsSubject.getValue();
    const suppliers = this.suppliersSubject.getValue();
    const suggestions: RestockSuggestion[] = [];

    items.forEach(item => {
      if (item.current_stock <= item.minimum_stock) {
        const supplier = suppliers.find(s => 
          s.items_supplied.some(suppliedItem => 
            suppliedItem.toLowerCase().includes(item.item_name.toLowerCase())
          )
        );

        const suggestedQuantity = Math.max(
          item.maximum_stock - item.current_stock,
          item.minimum_stock * 2
        );

        const urgency = this.calculateRestockUrgency(item);
        const daysUntilStockout = this.estimateDaysUntilStockout(item);

        suggestions.push({
          item_name: item.item_name,
          current_stock: item.current_stock,
          suggested_quantity: suggestedQuantity,
          estimated_cost: suggestedQuantity * item.unit_cost,
          supplier: supplier?.name || 'No preferred supplier',
          urgency,
          days_until_stockout: daysUntilStockout,
          usage_trend: 'stable' // Would need historical data
        });
      }
    });

    return suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  // UTILITY METHODS

  /**
   * Determine item status based on stock levels
   */
  private determineItemStatus(item: InventoryItem): InventoryItem['status'] {
    if (item.current_stock <= 0) return 'out_of_stock';
    if (item.current_stock <= item.minimum_stock) return 'low_stock';
    if (item.expiry_date && this.getDaysUntilExpiry(item.expiry_date) <= 0) return 'expired';
    return 'available';
  }

  /**
   * Calculate days until expiry
   */
  private getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate restock urgency
   */
  private calculateRestockUrgency(item: InventoryItem): 'low' | 'medium' | 'high' | 'critical' {
    if (item.current_stock <= 0) return 'critical';
    if (item.current_stock <= (item.minimum_stock * 0.5)) return 'high';
    if (item.current_stock <= item.minimum_stock) return 'medium';
    return 'low';
  }

  /**
   * Estimate days until stockout
   */
  private estimateDaysUntilStockout(item: InventoryItem): number {
    // This would typically use historical usage data
    // For now, we'll use a simple estimation based on current stock vs minimum
    const dailyUsage = (item.minimum_stock / 30) || 1; // Assume minimum stock lasts 30 days
    return Math.floor(item.current_stock / dailyUsage);
  }

  /**
   * Load default suppliers
   */
  private loadDefaultSuppliers(): void {
    const defaultSuppliers: Supplier[] = [
      {
        id: 1,
        name: 'Fresh Market Supply Co.',
        contact_person: 'Maria Santos',
        phone: '+63912-345-6789',
        email: 'orders@freshmarket.ph',
        address: '123 Market Street, Quezon City',
        payment_terms: 'Net 30',
        delivery_days: ['monday', 'wednesday', 'friday'],
        minimum_order: 1000,
        rating: 4.5,
        items_supplied: ['vegetables', 'fruits', 'herbs', 'meat', 'chicken'],
        active: true
      },
      {
        id: 2,
        name: 'Metro Food Distributors',
        contact_person: 'Juan Dela Cruz',
        phone: '+63917-234-5678',
        email: 'supply@metrofood.ph',
        address: '456 Industrial Ave, Makati City',
        payment_terms: 'Net 15',
        delivery_days: ['tuesday', 'thursday', 'saturday'],
        minimum_order: 2000,
        rating: 4.2,
        items_supplied: ['rice', 'noodles', 'canned goods', 'condiments', 'oil'],
        active: true
      },
      {
        id: 3,
        name: 'Seafood Direct Philippines',
        contact_person: 'Rosa Aquino',
        phone: '+63923-456-7890',
        email: 'orders@seafooddirect.ph',
        address: '789 Coastal Road, Paranaque City',
        payment_terms: 'COD',
        delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        minimum_order: 500,
        rating: 4.7,
        items_supplied: ['fish', 'shrimp', 'squid', 'crab', 'shellfish'],
        active: true
      }
    ];

    this.suppliersSubject.next(defaultSuppliers);
  }

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
   * Export inventory to CSV
   */
  exportInventoryToCsv(): string {
    const items = this.inventoryItemsSubject.getValue();
    const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Unit Cost', 'Total Value', 'Status', 'Supplier'];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.item_name}"`,
        `"${item.category}"`,
        item.current_stock,
        `"${item.unit}"`,
        item.unit_cost,
        item.total_value,
        `"${item.status}"`,
        `"${item.supplier || 'N/A'}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Import inventory from CSV
   */
  async importInventoryFromCsv(csvContent: string): Promise<boolean> {
    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const item: InventoryItem = {
            item_name: values[0].replace(/"/g, ''),
            description: values[1]?.replace(/"/g, '') || '',
            category: values[2]?.replace(/"/g, '') || 'other',
            unit: values[3]?.replace(/"/g, '') || 'pcs',
            current_stock: parseFloat(values[4]) || 0,
            minimum_stock: parseFloat(values[5]) || 0,
            maximum_stock: parseFloat(values[6]) || 100,
            unit_cost: parseFloat(values[7]) || 0,
            total_value: 0,
            supplier: values[8]?.replace(/"/g, '') || '',
            status: 'available'
          };

          await this.addInventoryItem(item);
        }
      }

      return true;
    } catch (error) {
      console.error('Error importing inventory:', error);
      return false;
    }
  }
}
