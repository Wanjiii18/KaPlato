import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface KarenderiaOwner {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface KarenderiaData {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  cuisine_type: string;
  operating_days: string[];
  opening_time: string;
  closing_time: string;
  delivery_available: boolean;
  pickup_available: boolean;
  delivery_fee?: number;
  minimum_order?: number;
}

export interface RegistrationData {
  owner: KarenderiaOwner;
  karenderia: KarenderiaData;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: any;
  karenderia?: any;
}

@Injectable({
  providedIn: 'root'
})
export class KarenderiaOwnerService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'karenderia_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      // Optionally validate token with backend
      this.getProfile().subscribe({
        next: (response) => {
          this.currentUserSubject.next(response);
        },
        error: () => {
          // Token is invalid, remove it
          this.logout();
        }
      });
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  register(registrationData: RegistrationData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/owner/register`, registrationData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    });
  }

  login(loginData: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/owner/login`, loginData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    });
  }

  logout(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      // Call logout endpoint
      this.http.post(`${this.apiUrl}/owner/logout`, {}, {
        headers: this.getAuthHeaders()
      }).subscribe({
        complete: () => {
          this.clearLocalData();
        },
        error: () => {
          // Clear local data even if logout fails
          this.clearLocalData();
        }
      });
    } else {
      this.clearLocalData();
    }
  }

  private clearLocalData(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/owner/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/owner/profile`, profileData, {
      headers: this.getAuthHeaders()
    });
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
  }

  // Cuisine types available for registration
  getCuisineTypes(): string[] {
    return [
      'Filipino',
      'Chinese',
      'Japanese',
      'Korean',
      'Thai',
      'Vietnamese',
      'American',
      'Italian',
      'Mexican',
      'Indian',
      'Mediterranean',
      'Fusion',
      'Fast Food',
      'Desserts',
      'Beverages'
    ];
  }

  // Days of the week for operating days
  getDaysOfWeek(): string[] {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }
}