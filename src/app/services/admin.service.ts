import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface KarenderiaResponse {
  id: number;
  business_name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  business_email?: string;
  opening_time: string;
  closing_time: string;
  operating_days: string[];
  delivery_fee: number;
  delivery_time_minutes: number;
  accepts_cash: boolean;
  accepts_online_payment: boolean;
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'rejected';
  approved_at?: string;
  approved_by?: number;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get all karenderias for admin management
  getAllKarenderias(): Observable<KarenderiaResponse[]> {
    return this.http.get<KarenderiaResponse[]>(`${this.apiUrl}/admin/karenderias`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get pending karenderias (need approval)
  getPendingKarenderias(): Observable<KarenderiaResponse[]> {
    return this.http.get<KarenderiaResponse[]>(`${this.apiUrl}/admin/karenderias/pending`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update karenderia status
  updateKarenderiaStatus(karenderiaId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/karenderias/${karenderiaId}/status`, 
      { status }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // Update karenderia location (latitude/longitude)
  updateKarenderiaLocation(karenderiaId: number, locationData: { latitude: number; longitude: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/karenderias/${karenderiaId}/location`, 
      locationData, 
      { headers: this.getAuthHeaders() }
    );
  }

  // Update karenderia details
  updateKarenderiaDetails(karenderiaId: number, updateData: Partial<KarenderiaResponse>): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/karenderias/${karenderiaId}`, 
      updateData, 
      { headers: this.getAuthHeaders() }
    );
  }

  // Delete/Reject karenderia
  deleteKarenderia(karenderiaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/karenderias/${karenderiaId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get karenderia by ID
  getKarenderiaById(karenderiaId: number): Observable<KarenderiaResponse> {
    return this.http.get<KarenderiaResponse>(`${this.apiUrl}/admin/karenderias/${karenderiaId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get admin dashboard stats
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  // User Management Methods
  getCustomers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/customers`, {
      headers: this.getAuthHeaders()
    });
  }

  getKarenderiaOwners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/karenderia-owners`, {
      headers: this.getAuthHeaders()
    });
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, { role }, {
      headers: this.getAuthHeaders()
    });
  }

  toggleUserStatus(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/toggle-status`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
