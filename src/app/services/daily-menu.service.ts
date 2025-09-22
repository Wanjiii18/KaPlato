import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DailyMenuItem {
  id: number;
  karenderia_id: number;
  menu_item_id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  quantity: number;
  original_quantity: number;
  is_available: boolean;
  special_price?: number;
  notes?: string;
  menu_item?: any;
  karenderia?: any;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

export interface CreateDailyMenuRequest {
  menu_item_id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  quantity: number;
  special_price?: number;
  notes?: string;
}

export interface UpdateDailyMenuRequest {
  quantity?: number;
  is_available?: boolean;
  special_price?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DailyMenuService {
  private apiUrl = `${environment.apiUrl}/daily-menu`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get daily menu items for the authenticated karenderia owner
   */
  getDailyMenu(date?: string, mealType?: string): Observable<any> {
    let params: any = {};
    if (date) params.date = date;
    if (mealType) params.meal_type = mealType;

    return this.http.get(this.apiUrl, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  /**
   * Add a menu item to the daily menu
   */
  addToDailyMenu(data: CreateDailyMenuRequest): Observable<any> {
    return this.http.post(this.apiUrl, data, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Update a daily menu item
   */
  updateDailyMenuItem(id: number, data: UpdateDailyMenuRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Remove a menu item from the daily menu
   */
  removeFromDailyMenu(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get available menu items for daily menu setup
   */
  getAvailableMenuItems(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available-items`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get available karenderias for customers (public endpoint)
   */
  getAvailableForCustomers(date: string, mealType: string, latitude?: number, longitude?: number, radius?: number): Observable<any> {
    let params: any = {
      date,
      meal_type: mealType
    };
    
    if (latitude !== undefined) params.latitude = latitude.toString();
    if (longitude !== undefined) params.longitude = longitude.toString();
    if (radius !== undefined) params.radius = radius.toString();

    return this.http.get(`${this.apiUrl}/available`, { params });
  }
}
