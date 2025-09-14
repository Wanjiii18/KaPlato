import { Injectable, NgZone } from '@angular/core';
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

  constructor(private http: HttpClient, private zone: NgZone) {}

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

  // Seed initial data for testing (places karenderias near Mandaue, Cebu)
  async seedInitialData(): Promise<void> {
    try {
      // Check if data already exists
      const response = await this.getAllKarenderias().toPromise();
      if (response && response.length > 0) {
        console.log('Karenderia data already exists, skipping seed');
        return;
      }

      // Base coordinates for Mandaue, Cebu (10.3231°N, 123.9319°E)
      const mandaueLat = 10.3231;
      const mandaueLng = 123.9319;

      const mockKarenderias = [
        {
          name: "Lola's Lutong Bahay",
          address: "A.C. Cortes Avenue, Mandaue City, Cebu",
          location: { latitude: mandaueLat + 0.001, longitude: mandaueLng + 0.001 }, // ~150m away
          description: "Authentic Filipino home-cooked meals",
          rating: 4.5,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Comfort Food'],
          contactNumber: "+63 32 345 6789",
          openingHours: {
            monday: { open: "06:00", close: "20:00" },
            tuesday: { open: "06:00", close: "20:00" },
            wednesday: { open: "06:00", close: "20:00" },
            thursday: { open: "06:00", close: "20:00" },
            friday: { open: "06:00", close: "20:00" },
            saturday: { open: "06:00", close: "20:00" },
            sunday: { open: "07:00", close: "19:00" }
          }
        },
        {
          name: "Cebu Lechon House",
          address: "Plaridel Street, Mandaue City, Cebu",
          location: { latitude: mandaueLat - 0.002, longitude: mandaueLng + 0.003 }, // ~300m away
          description: "Famous for crispy lechon and traditional Cebuano dishes",
          rating: 4.8,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Cebuano', 'Roasted'],
          contactNumber: "+63 32 567 8901",
          openingHours: {
            monday: { open: "10:00", close: "21:00" },
            tuesday: { open: "10:00", close: "21:00" },
            wednesday: { open: "10:00", close: "21:00" },
            thursday: { open: "10:00", close: "21:00" },
            friday: { open: "10:00", close: "22:00" },
            saturday: { open: "10:00", close: "22:00" },
            sunday: { open: "10:00", close: "21:00" }
          }
        },
        {
          name: "Tita's Carinderia",
          address: "Burgos Street, Mandaue City, Cebu",
          location: { latitude: mandaueLat + 0.003, longitude: mandaueLng - 0.001 }, // ~400m away
          description: "Affordable meals and snacks, perfect for students",
          rating: 4.2,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Street Food'],
          contactNumber: "+63 32 234 5678",
          openingHours: {
            monday: { open: "05:30", close: "19:00" },
            tuesday: { open: "05:30", close: "19:00" },
            wednesday: { open: "05:30", close: "19:00" },
            thursday: { open: "05:30", close: "19:00" },
            friday: { open: "05:30", close: "19:00" },
            saturday: { open: "06:00", close: "19:00" },
            sunday: { open: "06:00", close: "19:00", closed: true }
          }
        },
        {
          name: "Nanay's Kitchen",
          address: "Hernan Cortes Street, Mandaue City, Cebu",
          location: { latitude: mandaueLat - 0.001, longitude: mandaueLng - 0.002 }, // ~250m away
          description: "Home-style cooking with love, just like nanay makes",
          rating: 4.6,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Home Cooking'],
          contactNumber: "+63 32 345 7890",
          openingHours: {
            monday: { open: "06:00", close: "20:00" },
            tuesday: { open: "06:00", close: "20:00" },
            wednesday: { open: "06:00", close: "20:00" },
            thursday: { open: "06:00", close: "20:00" },
            friday: { open: "06:00", close: "20:00" },
            saturday: { open: "06:00", close: "20:00" },
            sunday: { open: "07:00", close: "19:00" }
          }
        },
        {
          name: "Sugbo Grill",
          address: "U.N. Avenue, Mandaue City, Cebu",
          location: { latitude: mandaueLat + 0.004, longitude: mandaueLng + 0.002 }, // ~500m away
          description: "Grilled specialties and seafood with Cebuano flavor",
          rating: 4.7,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Grilled', 'Seafood'],
          contactNumber: "+63 32 456 7891",
          openingHours: {
            monday: { open: "11:00", close: "22:00" },
            tuesday: { open: "11:00", close: "22:00" },
            wednesday: { open: "11:00", close: "22:00" },
            thursday: { open: "11:00", close: "22:00" },
            friday: { open: "11:00", close: "23:00" },
            saturday: { open: "11:00", close: "23:00" },
            sunday: { open: "11:00", close: "22:00" }
          }
        },
        {
          name: "Kuya's Pares House",
          address: "M.C. Briones Street, Mandaue City, Cebu",
          location: { latitude: mandaueLat - 0.003, longitude: mandaueLng + 0.001 }, // ~350m away
          description: "Best beef pares and goto in the area",
          rating: 4.3,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Beef', 'Soup'],
          contactNumber: "+63 32 567 8912",
          openingHours: {
            monday: { open: "18:00", close: "03:00" },
            tuesday: { open: "18:00", close: "03:00" },
            wednesday: { open: "18:00", close: "03:00" },
            thursday: { open: "18:00", close: "03:00" },
            friday: { open: "18:00", close: "04:00" },
            saturday: { open: "18:00", close: "04:00" },
            sunday: { open: "18:00", close: "03:00" }
          }
        }
      ];

      // Add each karenderia via API
      for (const karenderia of mockKarenderias) {
        await this.addKarenderia(karenderia).toPromise();
      }

      console.log('Successfully seeded initial Karenderia data for Mandaue, Cebu');
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  }

  // Add simple test karenderias for map testing
  async addTestKarenderias(): Promise<void> {
    try {
      // Clear existing data first for clean testing
      const karenderias = await this.getAllKarenderias().toPromise();
      if (karenderias) {
        for (const karenderia of karenderias) {
          if (karenderia.id) {
            await this.deleteKarenderia(karenderia.id).toPromise();
          }
        }
      }
      console.log('Cleared existing karenderia data');

      // Base coordinates for Mandaue, Cebu (your area)
      const mandaueLat = 10.3231;
      const mandaueLng = 123.9319;

      // Create 2 simple test karenderias very close to your location
      const testKarenderias = [
        {
          name: "Test Karenderia 1",
          address: "Near Mandaue City Hall, Cebu",
          location: { latitude: mandaueLat + 0.0008, longitude: mandaueLng + 0.0008 }, // ~90m away
          description: "First test karenderia for map search testing",
          rating: 4.2,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Test Food'],
          contactNumber: "+63 32 111 1111",
          openingHours: {
            monday: { open: "08:00", close: "18:00" },
            tuesday: { open: "08:00", close: "18:00" },
            wednesday: { open: "08:00", close: "18:00" },
            thursday: { open: "08:00", close: "18:00" },
            friday: { open: "08:00", close: "18:00" },
            saturday: { open: "08:00", close: "18:00" },
            sunday: { open: "09:00", close: "17:00" }
          }
        },
        {
          name: "Test Karenderia 2",
          address: "Mandaue Business Area, Cebu",
          location: { latitude: mandaueLat - 0.0012, longitude: mandaueLng + 0.0012 }, // ~130m away
          description: "Second test karenderia for search functionality",
          rating: 4.5,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Seafood', 'Test Food'],
          contactNumber: "+63 32 222 2222",
          openingHours: {
            monday: { open: "07:00", close: "19:00" },
            tuesday: { open: "07:00", close: "19:00" },
            wednesday: { open: "07:00", close: "19:00" },
            thursday: { open: "07:00", close: "19:00" },
            friday: { open: "07:00", close: "20:00" },
            saturday: { open: "07:00", close: "20:00" },
            sunday: { open: "08:00", close: "18:00" }
          }
        }
      ];

      // Add test karenderias via API
      for (const karenderia of testKarenderias) {
        await this.addKarenderia(karenderia).toPromise();
      }

      console.log('Successfully added 2 test karenderias near Mandaue, Cebu');
      console.log('Test Karenderia 1: ~90m from center');
      console.log('Test Karenderia 2: ~130m from center');
    } catch (error) {
      console.error('Error adding test karenderias:', error);
    }
  }

  // LocalStorage methods for testing without backend
  private readonly STORAGE_KEY = 'kaplato_karenderias';

  // Get all karenderias from localStorage
  getAllKarenderias_Local(): Observable<SimpleKarenderia[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const karenderias = stored ? JSON.parse(stored) : [];
      return from(Promise.resolve(karenderias));
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return from(Promise.resolve([]));
    }
  }

  // Get nearby karenderias from localStorage
  getNearbyKarenderias_Local(userLat: number, userLng: number, radiusInMeters: number): Observable<SimpleKarenderia[]> {
    return this.getAllKarenderias_Local().pipe(
      map(karenderias => 
        karenderias.filter(karenderia => {
          const distance = this.calculateDistance_Local(
            userLat, 
            userLng, 
            karenderia.location.latitude, 
            karenderia.location.longitude
          );
          return distance <= radiusInMeters;
        }).map(karenderia => ({
          ...karenderia,
          distance: this.calculateDistance_Local(
            userLat, 
            userLng, 
            karenderia.location.latitude, 
            karenderia.location.longitude
          )
        }))
      )
    );
  }

  // Add karenderia to localStorage
  addKarenderia_Local(karenderia: Omit<SimpleKarenderia, 'id'>): Observable<string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const karenderias = stored ? JSON.parse(stored) : [];
      
      const newKarenderia = {
        ...karenderia,
        id: Date.now().toString() // Simple ID generation
      };
      
      karenderias.push(newKarenderia);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(karenderias));
      
      console.log(`Added ${newKarenderia.name} to localStorage`);
      return from(Promise.resolve(newKarenderia.id));
    } catch (error) {
      console.error('Error adding to localStorage:', error);
      return from(Promise.reject(error));
    }
  }

  // Clear all karenderias from localStorage
  clearAllKarenderias_Local(): Observable<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Cleared all karenderias from localStorage');
      return from(Promise.resolve());
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return from(Promise.reject(error));
    }
  }

  // Calculate distance between two points (simplified)
  private calculateDistance_Local(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

  // Add test data to localStorage
  async addTestKarenderias_Local(userLat: number, userLng: number): Promise<void> {
    try {
      // Clear existing data
      await this.clearAllKarenderias_Local().toPromise();
      
      console.log(`Creating test data near: ${userLat}, ${userLng}`);

      // Create 4 simple test karenderias - 2 close, 2 far
      const testKarenderias = [
        {
          name: "Lola's Kitchen",
          address: `Near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
          location: { latitude: userLat + 0.001, longitude: userLng + 0.001 }, // ~110m away
          description: "Authentic Filipino home-style cooking",
          rating: 4.2,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Traditional'],
          contactNumber: "+63 32 111 1111",
          menu: [
            {
              id: '1',
              name: 'Adobo',
              price: 120,
              description: 'Classic Filipino braised pork and chicken in soy sauce and vinegar',
              ingredients: ['Pork', 'Chicken', 'Soy sauce', 'Vinegar', 'Garlic', 'Bay leaves', 'Black pepper'],
              allergens: ['Soy'],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '2',
              name: 'Sinigang na Baboy',
              price: 150,
              description: 'Pork ribs in tamarind soup with vegetables',
              ingredients: ['Pork ribs', 'Tamarind', 'Tomatoes', 'Onions', 'Kangkong', 'Radish', 'Eggplant'],
              allergens: [],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '3',
              name: 'Pancit Canton',
              price: 80,
              description: 'Stir-fried wheat noodles with vegetables and meat',
              ingredients: ['Wheat noodles', 'Pork', 'Shrimp', 'Cabbage', 'Carrots', 'Soy sauce', 'Oyster sauce'],
              allergens: ['Gluten', 'Shellfish', 'Soy'],
              category: 'Main Dish' as const,
              isAvailable: true
            }
          ]
        },
        {
          name: "Seafood Haven", 
          address: `Business area near you (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
          location: { latitude: userLat - 0.0015, longitude: userLng + 0.0015 }, // ~165m away
          description: "Fresh seafood and Filipino specialties",
          rating: 4.5,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Seafood'],
          contactNumber: "+63 32 222 2222",
          menu: [
            {
              id: '4',
              name: 'Grilled Bangus',
              price: 180,
              description: 'Grilled milkfish stuffed with tomatoes and onions',
              ingredients: ['Bangus (milkfish)', 'Tomatoes', 'Onions', 'Calamansi', 'Salt', 'Pepper'],
              allergens: ['Fish'],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '5',
              name: 'Kare-Kare',
              price: 200,
              description: 'Oxtail and vegetables in peanut sauce',
              ingredients: ['Oxtail', 'Tripe', 'Green beans', 'Eggplant', 'Peanut butter', 'Ground rice', 'Bagoong'],
              allergens: ['Peanuts', 'Fish (bagoong)'],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '6',
              name: 'Leche Flan',
              price: 60,
              description: 'Traditional Filipino custard dessert',
              ingredients: ['Egg yolks', 'Condensed milk', 'Evaporated milk', 'Sugar'],
              allergens: ['Eggs', 'Dairy'],
              category: 'Dessert' as const,
              isAvailable: true
            }
          ]
        },
        {
          name: "Mountain View Grill",
          address: `Far location (${(userLat + 0.015).toFixed(4)}, ${(userLng + 0.015).toFixed(4)})`,
          location: { latitude: userLat + 0.015, longitude: userLng + 0.015 }, // ~1600m away
          description: "Grilled specialties with a view",
          rating: 4.0,
          priceRange: 'Expensive' as const,
          cuisine: ['Filipino', 'Grilled'],
          contactNumber: "+63 32 333 3333",
          menu: [
            {
              id: '7',
              name: 'Lechon Kawali',
              price: 250,
              description: 'Crispy deep-fried pork belly',
              ingredients: ['Pork belly', 'Salt', 'Pepper', 'Bay leaves', 'Oil'],
              allergens: [],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '8',
              name: 'Sisig',
              price: 180,
              description: 'Sizzling chopped pork with onions and chili',
              ingredients: ['Pork face', 'Pork liver', 'Onions', 'Chili', 'Calamansi', 'Mayonnaise', 'Egg'],
              allergens: ['Eggs'],
              category: 'Appetizer' as const,
              isAvailable: true
            }
          ]
        },
        {
          name: "Countryside Diner",
          address: `Medium distance (${(userLat - 0.0155).toFixed(4)}, ${(userLng - 0.0155).toFixed(4)})`,
          location: { latitude: userLat - 0.0155, longitude: userLng - 0.0155 }, // ~1700m away
          description: "Comfort food in a cozy setting",
          rating: 4.3,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Comfort Food'],
          contactNumber: "+63 32 444 4444",
          menu: [
            {
              id: '9',
              name: 'Chicken Tinola',
              price: 140,
              description: 'Chicken soup with ginger, chayote, and malunggay',
              ingredients: ['Chicken', 'Ginger', 'Onions', 'Chayote', 'Malunggay leaves', 'Fish sauce'],
              allergens: ['Fish (fish sauce)'],
              category: 'Main Dish' as const,
              isAvailable: true
            },
            {
              id: '10',
              name: 'Beef Caldereta',
              price: 190,
              description: 'Beef stew with tomato sauce and vegetables',
              ingredients: ['Beef', 'Tomato sauce', 'Potatoes', 'Carrots', 'Bell peppers', 'Liver spread', 'Cheese'],
              allergens: ['Dairy'],
              category: 'Main Dish' as const,
              isAvailable: true
            }
          ]
        }
      ];

      // Add each karenderia
      for (const karenderia of testKarenderias) {
        await this.addKarenderia_Local(karenderia).toPromise();
      }

      console.log('✅ Successfully added 4 Filipino karenderias with menus to localStorage');
      console.log(`📍 ${testKarenderias[0].name}: ${testKarenderias[0].location.latitude}, ${testKarenderias[0].location.longitude} (~110m) - ${testKarenderias[0].menu?.length || 0} menu items`);
      console.log(`📍 ${testKarenderias[1].name}: ${testKarenderias[1].location.latitude}, ${testKarenderias[1].location.longitude} (~165m) - ${testKarenderias[1].menu?.length || 0} menu items`);
      console.log(`📍 ${testKarenderias[2].name}: ${testKarenderias[2].location.latitude}, ${testKarenderias[2].location.longitude} (~1600m) - ${testKarenderias[2].menu?.length || 0} menu items`);
      console.log(`📍 ${testKarenderias[3].name}: ${testKarenderias[3].location.latitude}, ${testKarenderias[3].location.longitude} (~1700m) - ${testKarenderias[3].menu?.length || 0} menu items`);
      
    } catch (error) {
      console.error('Error adding test karenderias to localStorage:', error);
      throw error;
    }
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

  // Update karenderia location (for karenderia owners)
  updateKarenderiaLocation(locationData: { latitude: number; longitude: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/karenderias/my-karenderia/location`, locationData, {
      headers: this.getHeaders()
    });
  }

}
