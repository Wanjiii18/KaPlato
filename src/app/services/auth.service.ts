import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: 'customer' | 'karenderia_owner' | 'admin';
  verified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'customer' | 'karenderia_owner';
}

export interface KarenderiaOwnerRegisterData {
  // User account data
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  
  // Business data
  business_name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone?: string | null;
  business_email?: string | null;
  opening_time?: string;
  closing_time?: string;
  operating_days?: string[];
  delivery_fee?: number;
  delivery_time_minutes?: number;
  accepts_cash?: boolean;
  accepts_online_payment?: boolean;
}

export interface AuthResponse {
  user: User;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  message?: string;
  status?: string;
  karenderia?: any;
}

export interface Allergen {
  id: string;
  name: string;
  category: string;
  notes?: string;
  addedAt?: Date;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface MealPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  caloriesPerDay: number;
  type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  meals?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private alertController: AlertController) {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    // Use sessionStorage instead of localStorage for automatic logout on app close
    const token = sessionStorage.getItem('auth_token');
    const userData = sessionStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('🔐 Attempting login with:', credentials);
    console.log('🌐 API URL:', `${this.apiUrl}/auth/login`);
    
    // EMERGENCY FIX FOR PRESENTATION - use emergency endpoint if alica
    if (credentials.email === 'alica@gmail.com') {
      console.log('🚨 Using emergency login for presentation');
      return this.http.post<AuthResponse>(`${this.apiUrl}/emergency-login`, {})
        .pipe(
          tap(response => {
            console.log('✅ Emergency login successful:', response);
            if (response.access_token) {
              sessionStorage.setItem('auth_token', response.access_token);
              sessionStorage.setItem('user_data', JSON.stringify(response.user));
              this.currentUserSubject.next(response.user);
            }
          }),
          catchError(error => {
            console.error('❌ Emergency login error:', error);
            throw error;
          })
        );
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Login successful:', response);
          // Only set token if it exists (successful login)
          if (response.access_token) {
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('user_data', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(error => {
          console.error('❌ Login error details:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          if (error.error) {
            console.error('❌ Server error response:', error.error);
          }
          throw error;
        })
      );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          // Auto-login customers but not karenderia owners
          if (response.access_token) {
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('user_data', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  registerKarenderiaOwner(registrationData: KarenderiaOwnerRegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register-karenderia-owner`, registrationData)
      .pipe(
        tap(response => {
          // Don't set token for karenderia owner registration - they need approval first
          // Only set token if it exists (which it shouldn't for pending approval)
          if (response.access_token) {
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('user_data', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(error => {
          console.error('Karenderia owner registration error:', error);
          throw error;
        })
      );
  }

  logout(): void {
    // Get the token before clearing it for server logout
    const token = sessionStorage.getItem('auth_token');
    
    // Clear ALL storage immediately and aggressively
    sessionStorage.clear(); // Clear entire sessionStorage
    localStorage.clear(); // Clear entire localStorage to be safe
    
    // Also manually remove specific items
    ['auth_token', 'user_data', 'karenderia_data', 'menu_cache', 'user_role', 'current_user'].forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    
    // Clear the user subject immediately
    this.currentUserSubject.next(null);

    // Optional: Notify server in background (don't wait for response)
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => console.log('Server logout successful'),
        error: () => console.log('Server logout failed (already logged out locally)')
      });
    }
  }

  // Simple logout with navigation - use this in components
  async logoutAndRedirect(): Promise<void> {
    // First, clear the authentication state
    this.logout();
    
    // Wait a small moment for the observable to update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Navigate to login with replace to prevent going back to protected route
    await this.router.navigate(['/login'], { 
      replaceUrl: true,
      skipLocationChange: false 
    });
  }

  // Logout with simple confirmation
  async logoutWithConfirmation(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'confirm',
          handler: () => {
            this.logoutAndRedirect();
          }
        }
      ]
    });

    await alert.present();
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  private getAuthHeaders(): { [key: string]: string } {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Reset password
  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { email });
  }

  // Update password
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // Verify email
  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { token });
  }

  // Resend verification email
  resendVerificationEmail(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-verification`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}
