import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface POSOrder {
  id?: number;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  table_number?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  items: POSOrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'gcash' | 'paymaya' | 'split';
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface POSOrderItem {
  id?: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  modifications?: string[];
  special_instructions?: string;
}

export interface Receipt {
  order_number: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  cashier_name: string;
  customer_name?: string;
  table_number?: string;
  order_type: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  payment_method: string;
  amount_paid: number;
  change: number;
  date_time: Date;
  footer_message?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  modifications?: string[];
}

export interface PaymentSplit {
  method: 'cash' | 'card' | 'gcash' | 'paymaya';
  amount: number;
  reference_number?: string;
}

export interface CashierSession {
  id?: number;
  cashier_id: number;
  cashier_name: string;
  start_time: Date;
  end_time?: Date;
  opening_cash: number;
  closing_cash?: number;
  total_sales: number;
  total_orders: number;
  status: 'active' | 'ended';
}

export interface DailySalesSummary {
  date: Date;
  total_sales: number;
  total_orders: number;
  cash_sales: number;
  card_sales: number;
  digital_sales: number;
  refunds: number;
  net_sales: number;
  tax_collected: number;
  service_charges: number;
  discounts_given: number;
  hourly_breakdown: {
    hour: number;
    sales: number;
    orders: number;
  }[];
}

export interface POSSettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  tax_rate: number;
  service_charge_rate: number;
  receipt_footer: string;
  auto_print_receipt: boolean;
  require_customer_info: boolean;
  enable_table_service: boolean;
  enable_delivery: boolean;
  max_discount_percentage: number;
  currency: string;
  receipt_logo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class POSService {
  private apiUrl = environment.apiUrl;
  
  private currentOrderSubject = new BehaviorSubject<POSOrder | null>(null);
  private ordersSubject = new BehaviorSubject<POSOrder[]>([]);
  private cashierSessionSubject = new BehaviorSubject<CashierSession | null>(null);
  private posSettingsSubject = new BehaviorSubject<POSSettings | null>(null);

  currentOrder$ = this.currentOrderSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();
  cashierSession$ = this.cashierSessionSubject.asObservable();
  posSettings$ = this.posSettingsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPOSSettings();
    this.loadActiveSession();
    this.loadTodaysOrders();
    this.initializeNewOrder();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ORDER MANAGEMENT

  /**
   * Initialize a new order
   */
  initializeNewOrder(): void {
    const orderNumber = this.generateOrderNumber();
    const newOrder: POSOrder = {
      order_number: orderNumber,
      order_type: 'dine_in',
      items: [],
      subtotal: 0,
      tax: 0,
      service_charge: 0,
      discount: 0,
      total: 0,
      payment_method: 'cash',
      payment_status: 'pending',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.currentOrderSubject.next(newOrder);
  }

  /**
   * Add item to current order
   */
  addItemToOrder(menuItemId: number, menuItemName: string, unitPrice: number, quantity: number = 1, modifications?: string[]): void {
    const currentOrder = this.currentOrderSubject.getValue();
    if (!currentOrder) return;

    const existingItemIndex = currentOrder.items.findIndex(
      item => item.menu_item_id === menuItemId && JSON.stringify(item.modifications) === JSON.stringify(modifications)
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      currentOrder.items[existingItemIndex].quantity += quantity;
      currentOrder.items[existingItemIndex].total_price = 
        currentOrder.items[existingItemIndex].quantity * currentOrder.items[existingItemIndex].unit_price;
    } else {
      // Add new item
      const newItem: POSOrderItem = {
        menu_item_id: menuItemId,
        menu_item_name: menuItemName,
        quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        modifications
      };
      currentOrder.items.push(newItem);
    }

    this.calculateOrderTotals(currentOrder);
    this.currentOrderSubject.next({ ...currentOrder });
  }

  /**
   * Remove item from current order
   */
  removeItemFromOrder(itemIndex: number): void {
    const currentOrder = this.currentOrderSubject.getValue();
    if (!currentOrder || itemIndex < 0 || itemIndex >= currentOrder.items.length) return;

    currentOrder.items.splice(itemIndex, 1);
    this.calculateOrderTotals(currentOrder);
    this.currentOrderSubject.next({ ...currentOrder });
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(itemIndex: number, newQuantity: number): void {
    const currentOrder = this.currentOrderSubject.getValue();
    if (!currentOrder || itemIndex < 0 || itemIndex >= currentOrder.items.length) return;

    if (newQuantity <= 0) {
      this.removeItemFromOrder(itemIndex);
      return;
    }

    currentOrder.items[itemIndex].quantity = newQuantity;
    currentOrder.items[itemIndex].total_price = newQuantity * currentOrder.items[itemIndex].unit_price;
    
    this.calculateOrderTotals(currentOrder);
    this.currentOrderSubject.next({ ...currentOrder });
  }

  /**
   * Apply discount to order
   */
  applyDiscount(discountAmount: number, discountType: 'amount' | 'percentage' = 'amount'): boolean {
    const currentOrder = this.currentOrderSubject.getValue();
    const settings = this.posSettingsSubject.getValue();
    if (!currentOrder || !settings) return false;

    let calculatedDiscount = 0;
    
    if (discountType === 'percentage') {
      if (discountAmount > settings.max_discount_percentage) {
        return false; // Discount exceeds maximum allowed
      }
      calculatedDiscount = (currentOrder.subtotal * discountAmount) / 100;
    } else {
      calculatedDiscount = discountAmount;
    }

    if (calculatedDiscount > currentOrder.subtotal) {
      return false; // Discount cannot exceed subtotal
    }

    currentOrder.discount = calculatedDiscount;
    this.calculateOrderTotals(currentOrder);
    this.currentOrderSubject.next({ ...currentOrder });
    return true;
  }

  /**
   * Update order details
   */
  updateOrderDetails(updates: Partial<POSOrder>): void {
    const currentOrder = this.currentOrderSubject.getValue();
    if (!currentOrder) return;

    Object.assign(currentOrder, updates);
    this.currentOrderSubject.next({ ...currentOrder });
  }

  // PAYMENT PROCESSING

  /**
   * Process payment for current order
   */
  async processPayment(paymentMethod: POSOrder['payment_method'], amountPaid: number, splits?: PaymentSplit[]): Promise<{ success: boolean; receipt?: Receipt; change?: number }> {
    const currentOrder = this.currentOrderSubject.getValue();
    if (!currentOrder) {
      return { success: false };
    }

    try {
      // Calculate change
      const change = Math.max(0, amountPaid - currentOrder.total);

      // Update order status
      currentOrder.payment_method = paymentMethod;
      currentOrder.payment_status = 'paid';
      currentOrder.status = 'preparing';
      currentOrder.updated_at = new Date();

      // Save order to backend
      const savedOrder = await this.saveOrder(currentOrder);
      if (!savedOrder) {
        return { success: false };
      }

      // Generate receipt
      const receipt = this.generateReceipt(savedOrder, amountPaid, change);

      // Update local state
      const orders = this.ordersSubject.getValue();
      this.ordersSubject.next([savedOrder, ...orders]);

      // Update cashier session
      await this.updateCashierSession(savedOrder);

      // Initialize new order for next transaction
      this.initializeNewOrder();

      return { success: true, receipt, change };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false };
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderNumber: string, refundAmount: number, reason: string): Promise<boolean> {
    try {
      const response = await this.http.post(`${this.apiUrl}/pos/refund`, {
        order_number: orderNumber,
        refund_amount: refundAmount,
        reason
      }, { headers: this.getHeaders() }).toPromise();

      // Update local order status
      const orders = this.ordersSubject.getValue();
      const orderIndex = orders.findIndex(o => o.order_number === orderNumber);
      if (orderIndex !== -1) {
        orders[orderIndex].payment_status = 'refunded';
        this.ordersSubject.next([...orders]);
      }

      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      return false;
    }
  }

  // ORDER STATUS MANAGEMENT

  /**
   * Update order status
   */
  async updateOrderStatus(orderNumber: string, newStatus: POSOrder['status']): Promise<boolean> {
    try {
      await this.http.put(`${this.apiUrl}/pos/orders/${orderNumber}/status`, {
        status: newStatus
      }, { headers: this.getHeaders() }).toPromise();

      // Update local state
      const orders = this.ordersSubject.getValue();
      const orderIndex = orders.findIndex(o => o.order_number === orderNumber);
      if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updated_at = new Date();
        this.ordersSubject.next([...orders]);
      }

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // CASHIER SESSION MANAGEMENT

  /**
   * Start cashier session
   */
  async startCashierSession(cashierName: string, openingCash: number): Promise<boolean> {
    try {
      const session: CashierSession = {
        cashier_id: 1, // Get from auth service
        cashier_name: cashierName,
        start_time: new Date(),
        opening_cash: openingCash,
        total_sales: 0,
        total_orders: 0,
        status: 'active'
      };

      const response = await this.http.post<{ data: CashierSession }>(`${this.apiUrl}/pos/sessions`, session, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.cashierSessionSubject.next(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting cashier session:', error);
      return false;
    }
  }

  /**
   * End cashier session
   */
  async endCashierSession(closingCash: number): Promise<boolean> {
    try {
      const session = this.cashierSessionSubject.getValue();
      if (!session) return false;

      const updatedSession = {
        ...session,
        end_time: new Date(),
        closing_cash: closingCash,
        status: 'ended' as const
      };

      await this.http.put(`${this.apiUrl}/pos/sessions/${session.id}`, updatedSession, {
        headers: this.getHeaders()
      }).toPromise();

      this.cashierSessionSubject.next(null);
      return true;
    } catch (error) {
      console.error('Error ending cashier session:', error);
      return false;
    }
  }

  // RECEIPT GENERATION

  /**
   * Generate receipt for order
   */
  generateReceipt(order: POSOrder, amountPaid: number, change: number): Receipt {
    const settings = this.posSettingsSubject.getValue();
    const session = this.cashierSessionSubject.getValue();

    const receiptItems: ReceiptItem[] = order.items.map(item => ({
      name: item.menu_item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      modifications: item.modifications
    }));

    return {
      order_number: order.order_number,
      business_name: settings?.business_name || 'Karenderia POS',
      business_address: settings?.business_address || '',
      business_phone: settings?.business_phone || '',
      cashier_name: session?.cashier_name || 'Cashier',
      customer_name: order.customer_name,
      table_number: order.table_number,
      order_type: order.order_type,
      items: receiptItems,
      subtotal: order.subtotal,
      tax: order.tax,
      service_charge: order.service_charge,
      discount: order.discount,
      total: order.total,
      payment_method: order.payment_method,
      amount_paid: amountPaid,
      change: change,
      date_time: order.created_at,
      footer_message: settings?.receipt_footer
    };
  }

  /**
   * Print receipt (browser print)
   */
  printReceipt(receipt: Receipt): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = this.generateReceiptHtml(receipt);
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  /**
   * Generate receipt HTML for printing
   */
  private generateReceiptHtml(receipt: Receipt): string {
    const itemsHtml = receipt.items.map(item => `
      <tr>
        <td>${item.name}${item.modifications ? '<br><small>' + item.modifications.join(', ') + '</small>' : ''}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${this.formatPhp(item.unit_price)}</td>
        <td style="text-align: right;">${this.formatPhp(item.total_price)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.order_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .business-name { font-weight: bold; font-size: 16px; }
          .order-info { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 5px; text-align: left; }
          .total-line { border-top: 1px solid #000; }
          .final-total { border-top: 2px solid #000; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          .dashed-line { border-top: 1px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="business-name">${receipt.business_name}</div>
            <div>${receipt.business_address}</div>
            <div>${receipt.business_phone}</div>
          </div>

          <div class="dashed-line"></div>

          <div class="order-info">
            <div><strong>Order #:</strong> ${receipt.order_number}</div>
            <div><strong>Date:</strong> ${receipt.date_time.toLocaleString()}</div>
            <div><strong>Cashier:</strong> ${receipt.cashier_name}</div>
            ${receipt.customer_name ? `<div><strong>Customer:</strong> ${receipt.customer_name}</div>` : ''}
            ${receipt.table_number ? `<div><strong>Table:</strong> ${receipt.table_number}</div>` : ''}
            <div><strong>Type:</strong> ${receipt.order_type.replace('_', ' ').toUpperCase()}</div>
          </div>

          <div class="dashed-line"></div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="dashed-line"></div>

          <table>
            <tr>
              <td><strong>Subtotal:</strong></td>
              <td style="text-align: right;"><strong>${this.formatPhp(receipt.subtotal)}</strong></td>
            </tr>
            ${receipt.discount > 0 ? `
            <tr>
              <td>Discount:</td>
              <td style="text-align: right;">-${this.formatPhp(receipt.discount)}</td>
            </tr>` : ''}
            ${receipt.service_charge > 0 ? `
            <tr>
              <td>Service Charge:</td>
              <td style="text-align: right;">${this.formatPhp(receipt.service_charge)}</td>
            </tr>` : ''}
            ${receipt.tax > 0 ? `
            <tr>
              <td>Tax:</td>
              <td style="text-align: right;">${this.formatPhp(receipt.tax)}</td>
            </tr>` : ''}
            <tr class="final-total">
              <td><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${this.formatPhp(receipt.total)}</strong></td>
            </tr>
            <tr>
              <td>Payment (${receipt.payment_method.toUpperCase()}):</td>
              <td style="text-align: right;">${this.formatPhp(receipt.amount_paid)}</td>
            </tr>
            <tr>
              <td><strong>Change:</strong></td>
              <td style="text-align: right;"><strong>${this.formatPhp(receipt.change)}</strong></td>
            </tr>
          </table>

          <div class="dashed-line"></div>

          <div class="footer">
            ${receipt.footer_message || 'Thank you for your business!'}
            <br><br>
            This serves as your official receipt.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // REPORTING

  /**
   * Get daily sales summary
   */
  async getDailySalesSummary(date?: Date): Promise<DailySalesSummary | null> {
    try {
      const targetDate = date || new Date();
      const response = await this.http.get<{ data: DailySalesSummary }>(`${this.apiUrl}/pos/sales-summary`, {
        headers: this.getHeaders(),
        params: { date: targetDate.toISOString().split('T')[0] }
      }).toPromise();

      return response?.data || null;
    } catch (error) {
      console.error('Error getting daily sales summary:', error);
      return null;
    }
  }

  // UTILITY METHODS

  /**
   * Calculate order totals
   */
  private calculateOrderTotals(order: POSOrder): void {
    const settings = this.posSettingsSubject.getValue();
    
    // Calculate subtotal
    order.subtotal = order.items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Calculate tax and service charge
    const taxRate = settings?.tax_rate || 0.12;
    const serviceChargeRate = settings?.service_charge_rate || 0;
    
    order.tax = (order.subtotal - order.discount) * taxRate;
    order.service_charge = (order.subtotal - order.discount) * serviceChargeRate;
    
    // Calculate total
    order.total = order.subtotal - order.discount + order.tax + order.service_charge;
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${dateStr}-${timeStr}-${randomStr}`;
  }

  /**
   * Save order to backend
   */
  private async saveOrder(order: POSOrder): Promise<POSOrder | null> {
    try {
      const response = await this.http.post<{ data: POSOrder }>(`${this.apiUrl}/pos/orders`, order, {
        headers: this.getHeaders()
      }).toPromise();

      return response?.data || null;
    } catch (error) {
      console.error('Error saving order:', error);
      return null;
    }
  }

  /**
   * Update cashier session with new sale
   */
  private async updateCashierSession(order: POSOrder): Promise<void> {
    const session = this.cashierSessionSubject.getValue();
    if (!session) return;

    session.total_sales += order.total;
    session.total_orders += 1;

    this.cashierSessionSubject.next({ ...session });
  }

  /**
   * Load active cashier session
   */
  private async loadActiveSession(): Promise<void> {
    try {
      const response = await this.http.get<{ data: CashierSession }>(`${this.apiUrl}/pos/sessions/active`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.cashierSessionSubject.next(response.data);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  }

  /**
   * Load today's orders
   */
  private async loadTodaysOrders(): Promise<void> {
    try {
      const response = await this.http.get<{ data: POSOrder[] }>(`${this.apiUrl}/pos/orders/today`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.ordersSubject.next(response.data);
      }
    } catch (error) {
      console.error('Error loading today\'s orders:', error);
    }
  }

  /**
   * Load POS settings
   */
  private async loadPOSSettings(): Promise<void> {
    try {
      const response = await this.http.get<{ data: POSSettings }>(`${this.apiUrl}/pos/settings`, {
        headers: this.getHeaders()
      }).toPromise();

      if (response?.data) {
        this.posSettingsSubject.next(response.data);
      } else {
        // Load default settings
        this.loadDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading POS settings:', error);
      this.loadDefaultSettings();
    }
  }

  /**
   * Load default POS settings
   */
  private loadDefaultSettings(): void {
    const defaultSettings: POSSettings = {
      business_name: 'Karenderia POS',
      business_address: 'Your Business Address',
      business_phone: '+63 XXX XXX XXXX',
      tax_rate: 0.12,
      service_charge_rate: 0.10,
      receipt_footer: 'Thank you for your business!\nPlease come again!',
      auto_print_receipt: true,
      require_customer_info: false,
      enable_table_service: true,
      enable_delivery: true,
      max_discount_percentage: 20,
      currency: 'PHP'
    };

    this.posSettingsSubject.next(defaultSettings);
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
}
