import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  description?: string;
  ingredients: string[];
  allergens: string[];
  category: 'Main Dish' | 'Appetizer' | 'Dessert' | 'Beverage' | 'Side Dish';
  isAvailable: boolean;
  imageUrl?: string;
}

export interface SimpleKarenderia {
  id?: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  description?: string;
  rating?: number;
  priceRange: 'Budget' | 'Moderate' | 'Expensive';
  cuisine?: string[];
  contactNumber?: string;
  distance?: number;
  menu?: MenuItem[];
}

// Backend API response interface
export interface KarenderiaApiResponse {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating: number;
  isOpen: boolean;
  cuisine: string;
  priceRange: string;
  imageUrl?: string;
  deliveryTime: string;
  deliveryFee: number;
  status: string;
  phone?: string;
  email?: string;
  operating_hours?: any;
  accepts_cash?: boolean;
  accepts_online_payment?: boolean;
  menu_items_count?: number;
  owner?: string;
  delivery_time_minutes?: number;
  average_rating?: number;
}

export interface Karenderia {
  id?: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  description?: string;
  rating?: number;
  priceRange: 'Budget' | 'Moderate' | 'Expensive';
  cuisine?: string[];
  openingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean } | { closed: true; open?: string; close?: string };
  };
  contactNumber?: string;
  imageUrl?: string;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  distance?: number;
  // Backend API properties
  latitude?: number;
  longitude?: number;
  status?: string;
  delivery_time_minutes?: number;
  average_rating?: number;
  isOpen?: boolean;
  deliveryTime?: string;
  deliveryFee?: number;
}


@Injectable({
  providedIn: 'root'
})
export class KarenderiaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Get all karenderias
  getAllKarenderias(): Observable<Karenderia[]> {
    return this.http.get<{ data: KarenderiaApiResponse[] }>(`${this.apiUrl}/karenderias`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data.map(k => ({
        id: k.id.toString(),
        name: k.name,
        address: k.address,
        location: {
          latitude: k.latitude,
          longitude: k.longitude
        },
        description: k.description,
        rating: k.rating || k.average_rating || 4.0,
        priceRange: 'Moderate' as 'Budget' | 'Moderate' | 'Expensive',
        cuisine: [k.cuisine || 'Filipino'],
        contactNumber: k.phone,
        imageUrl: k.imageUrl,
        distance: k.distance,
        // Backend properties
        latitude: k.latitude,
        longitude: k.longitude,
        status: k.status,
        delivery_time_minutes: k.delivery_time_minutes,
        average_rating: k.average_rating,
        isOpen: k.isOpen,
        deliveryTime: k.deliveryTime,
        deliveryFee: k.deliveryFee
      })))
    );
  }

  // Get nearby karenderias within radius (in meters)
  getNearbyKarenderias(userLat: number, userLng: number, radiusInMeters: number): Observable<Karenderia[]> {
    const params = {
      latitude: userLat.toString(),
      longitude: userLng.toString(),
      radius: radiusInMeters.toString()
    };

    return this.http.get<{ data: KarenderiaApiResponse[] }>(`${this.apiUrl}/karenderias/nearby`, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.data.map(k => ({
        id: k.id.toString(),
        name: k.name,
        address: k.address,
        location: {
          latitude: k.latitude,
          longitude: k.longitude
        },
        description: k.description,
        rating: k.rating || k.average_rating || 4.0,
        priceRange: 'Moderate' as 'Budget' | 'Moderate' | 'Expensive',
        cuisine: [k.cuisine || 'Filipino'],
        contactNumber: k.phone,
        imageUrl: k.imageUrl,
        distance: k.distance,
        // Backend properties
        latitude: k.latitude,
        longitude: k.longitude,
        status: k.status,
        delivery_time_minutes: k.delivery_time_minutes,
        average_rating: k.average_rating,
        isOpen: k.isOpen,
        deliveryTime: k.deliveryTime,
        deliveryFee: k.deliveryFee
      })))
    );
  }

  // Get karenderia by ID
  getKarenderiaById(id: string): Observable<Karenderia | null> {
    return this.http.get<{ data: Karenderia }>(`${this.apiUrl}/karenderias/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data)
    );
  }

  // Add new karenderia
  addKarenderia(karenderia: Omit<Karenderia, 'id'>): Observable<string> {
    return this.http.post<{ data: { id: string } }>(`${this.apiUrl}/karenderias`, karenderia, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data.id)
    );
  }

  // Update karenderia
  updateKarenderia(id: string, updates: Partial<Karenderia>): Observable<void> {
    return this.http.put<any>(`${this.apiUrl}/karenderias/${id}`, updates, { 
      headers: this.getHeaders() 
    }).pipe(
      map(() => void 0)
    );
  }

  // Delete karenderia
  deleteKarenderia(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/karenderias/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(() => void 0)
    );
  }

  // Search karenderias by name or cuisine
  searchKarenderias(searchTerm: string): Observable<Karenderia[]> {
    const params = { search: searchTerm };
    
    return this.http.get<{ data: Karenderia[] }>(`${this.apiUrl}/karenderias/search`, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.data)
    );
  }

  // Get menu items for a specific karenderia
  getMenuItemsForKarenderia(karenderiaId: string): Observable<MenuItem[]> {
    console.log('🔍 Fetching menu items for karenderia:', karenderiaId);
    
    const params = { karenderia: karenderiaId };
    
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/menu-items/search`, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => {
        console.log('📋 Backend response:', response);
        
        if (!response.data || response.data.length === 0) {
          console.log('⚠️ No menu items found for karenderia:', karenderiaId);
          return [];
        }

        // Transform backend data to MenuItem interface
        return response.data.map(item => ({
          id: item.id?.toString(),
          name: item.name,
          description: item.description || 'Delicious Filipino dish',
          price: parseFloat(item.price) || 0,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          category: this.mapBackendCategory(item.category),
          isAvailable: item.available !== false,
          imageUrl: item.image || 'assets/images/food-placeholder.jpg'
        }));
      })
    );
  }

  // Helper method to map backend categories to MenuItem categories
  private mapBackendCategory(backendCategory: string): MenuItem['category'] {
    const categoryMap: { [key: string]: MenuItem['category'] } = {
      'main_course': 'Main Dish',
      'main': 'Main Dish',
      'appetizer': 'Appetizer',
      'appetizers': 'Appetizer',
      'dessert': 'Dessert',
      'desserts': 'Dessert',
      'beverage': 'Beverage',
      'beverages': 'Beverage',
      'drink': 'Beverage',
      'drinks': 'Beverage',
      'side': 'Side Dish',
      'sides': 'Side Dish',
      'side_dish': 'Side Dish'
    };

    return categoryMap[backendCategory?.toLowerCase()] || 'Main Dish';
  }

  // Calculate distance between two points using Haversine formula (returns meters)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Get current user's karenderia application
  getMyKarenderia(): Observable<any> {
    return this.http.get(`${this.apiUrl}/karenderias/my-karenderia`, {
      headers: this.getHeaders()
    });
  }

  // Submit karenderia registration
  registerKarenderia(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/karenderias`, data, {
      headers: this.getHeaders()
    });
  }

  // Update karenderia (for owner/admin use)
  updateKarenderiaData(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/karenderias/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  // Get current user's karenderia (for karenderia owners)
  getCurrentUserKarenderia(): Observable<any> {
    return this.http.get(`${this.apiUrl}/karenderias/my-karenderia`, {
      headers: this.getHeaders()
    });
  }

  // Update current owner's karenderia application or profile details
  updateCurrentUserKarenderia(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/karenderias/my-karenderia`, data, {
      headers: this.getHeaders()
    });
  }

}
