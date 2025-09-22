import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  id: number;
  karenderia_id: number;
  item_name: string;
  description?: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit_cost: number;
  total_value: number;
  supplier?: string;
  last_restocked?: string;
  expiry_date?: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories: string[];
}

export interface CreateInventoryData {
  item_name: string;
  description?: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit_cost: number;
  supplier?: string;
  expiry_date?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all inventory items with stats
   */
  getInventory(): Observable<any> {
    return this.http.get(this.baseUrl, { headers: this.getAuthHeaders() });
  }

  /**
   * Get low stock alerts
   */
  getLowStockAlerts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/alerts`, { headers: this.getAuthHeaders() });
  }

  /**
   * Create new inventory item
   */
  createInventoryItem(data: CreateInventoryData): Observable<any> {
    return this.http.post(this.baseUrl, data, { headers: this.getAuthHeaders() });
  }

  /**
   * Update inventory item
   */
  updateInventoryItem(id: number, data: Partial<CreateInventoryData>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data, { headers: this.getAuthHeaders() });
  }

  /**
   * Restock inventory item
   */
  restockItem(id: number, quantity: number, unitCost?: number): Observable<any> {
    const data: any = { quantity };
    if (unitCost !== undefined) {
      data.unit_cost = unitCost;
    }
    return this.http.post(`${this.baseUrl}/${id}/restock`, data, { headers: this.getAuthHeaders() });
  }

  /**
   * Delete inventory item
   */
  deleteInventoryItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
