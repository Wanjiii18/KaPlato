import { Injectable, NgZone } from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, GeoPoint, getDoc, setDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

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
}

export interface Karenderia {
  id?: string;
  name: string;
  address: string;
  location: GeoPoint;
  description?: string;
  rating?: number;
  priceRange: 'Budget' | 'Moderate' | 'Expensive';
  cuisine?: string[];
  openingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  contactNumber?: string;
  imageUrl?: string;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  distance?: number;
}

@Injectable({
  providedIn: 'root'
})
export class KarenderiaService {
  private karenderiaCollection = collection(this.firestore, 'karenderias');

  constructor(private firestore: Firestore, private zone: NgZone) {}

  // Get all karenderias
  getAllKarenderias(): Observable<Karenderia[]> {
    const promise = this.zone.run(() => 
      getDocs(this.karenderiaCollection).then(snapshot => 
        snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Karenderia))
      )
    );
    return from(promise);
  }

  // Get nearby karenderias within radius (in meters)
  getNearbyKarenderias(userLat: number, userLng: number, radiusInMeters: number): Observable<Karenderia[]> {
    return this.getAllKarenderias().pipe(
      map(karenderias => 
        karenderias.filter(karenderia => {
          const distance = this.calculateDistance(
            userLat, 
            userLng, 
            karenderia.location.latitude, 
            karenderia.location.longitude
          );
          return distance <= radiusInMeters;
        }).map(karenderia => ({
          ...karenderia,
          distance: this.calculateDistance(
            userLat, 
            userLng, 
            karenderia.location.latitude, 
            karenderia.location.longitude
          )
        }))
      )
    );
  }

  // Get karenderia by ID
  getKarenderiaById(id: string): Observable<Karenderia | null> {
    const promise = this.zone.run(() => 
      getDoc(doc(this.firestore, 'karenderias', id)).then(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Karenderia;
        }
        return null;
      })
    );
    return from(promise);
  }

  // Add new karenderia
  addKarenderia(karenderia: Omit<Karenderia, 'id'>): Observable<string> {
    const karenderiaData = {
      ...karenderia,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const promise = this.zone.run(() => 
      addDoc(this.karenderiaCollection, karenderiaData).then(docRef => docRef.id)
    );
    return from(promise);
  }

  // Update karenderia
  updateKarenderia(id: string, updates: Partial<Karenderia>): Observable<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const promise = this.zone.run(() => 
      updateDoc(doc(this.firestore, 'karenderias', id), updateData)
    );
    return from(promise);
  }

  // Delete karenderia
  deleteKarenderia(id: string): Observable<void> {
    const promise = this.zone.run(() => 
      deleteDoc(doc(this.firestore, 'karenderias', id))
    );
    return from(promise);
  }

  // Search karenderias by name or cuisine
  searchKarenderias(searchTerm: string): Observable<Karenderia[]> {
    const promise = this.zone.run(() => 
      getDocs(this.karenderiaCollection).then(snapshot => {
        const results = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Karenderia))
          .filter(karenderia => 
            karenderia.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            karenderia.cuisine?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        return results;
      })
    );
    return from(promise);
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
      const snapshot = await this.zone.run(() => getDocs(this.karenderiaCollection));
      if (!snapshot.empty) {
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
          location: new GeoPoint(mandaueLat + 0.001, mandaueLng + 0.001), // ~150m away
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
          location: new GeoPoint(mandaueLat - 0.002, mandaueLng + 0.003), // ~300m away
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
          location: new GeoPoint(mandaueLat + 0.003, mandaueLng - 0.001), // ~400m away
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
            sunday: { closed: true }
          }
        },
        {
          name: "Nanay's Kitchen",
          address: "Hernan Cortes Street, Mandaue City, Cebu",
          location: new GeoPoint(mandaueLat - 0.001, mandaueLng - 0.002), // ~250m away
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
          location: new GeoPoint(mandaueLat + 0.004, mandaueLng + 0.002), // ~500m away
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
          location: new GeoPoint(mandaueLat - 0.003, mandaueLng + 0.001), // ~350m away
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

      // Add each karenderia to Firestore
      for (const karenderia of mockKarenderias) {
        await this.zone.run(() => addDoc(this.karenderiaCollection, {
          ...karenderia,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
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
      const snapshot = await this.zone.run(() => getDocs(this.karenderiaCollection));
      const deletePromises = snapshot.docs.map(doc => 
        this.zone.run(() => deleteDoc(doc.ref))
      );
      await Promise.all(deletePromises);
      console.log('Cleared existing karenderia data');

      // Base coordinates for Mandaue, Cebu (your area)
      const mandaueLat = 10.3231;
      const mandaueLng = 123.9319;

      // Create 2 simple test karenderias very close to your location
      const testKarenderias = [
        {
          name: "Test Karenderia 1",
          address: "Near Mandaue City Hall, Cebu",
          location: new GeoPoint(mandaueLat + 0.0008, mandaueLng + 0.0008), // ~90m away
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
          location: new GeoPoint(mandaueLat - 0.0012, mandaueLng + 0.0012), // ~130m away
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

      // Add test karenderias to Firestore
      for (const karenderia of testKarenderias) {
        await this.zone.run(() => addDoc(this.karenderiaCollection, {
          ...karenderia,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
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
          name: "Test Karenderia 1",
          address: `Near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
          location: { latitude: userLat + 0.001, longitude: userLng + 0.001 }, // ~110m away
          description: "First test karenderia for map search testing",
          rating: 4.2,
          priceRange: 'Budget' as const,
          cuisine: ['Filipino', 'Test Food'],
          contactNumber: "+63 32 111 1111"
        },
        {
          name: "Test Karenderia 2", 
          address: `Business area near you (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
          location: { latitude: userLat - 0.0015, longitude: userLng + 0.0015 }, // ~165m away
          description: "Second test karenderia for search functionality",
          rating: 4.5,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Seafood', 'Test Food'],
          contactNumber: "+63 32 222 2222"
        },
        {
          name: "Test Karenderia 3 (Far Away)",
          address: `Far location (${(userLat + 0.015).toFixed(4)}, ${(userLng + 0.015).toFixed(4)})`,
          location: { latitude: userLat + 0.015, longitude: userLng + 0.015 }, // ~1600m away
          description: "Third test karenderia - should NOT appear in 500m searches",
          rating: 4.0,
          priceRange: 'Expensive' as const,
          cuisine: ['Filipino', 'Premium Food'],
          contactNumber: "+63 32 333 3333"
        },
        {
          name: "Test Karenderia 4 (1700m Away)",
          address: `Medium distance (${(userLat - 0.0155).toFixed(4)}, ${(userLng - 0.0155).toFixed(4)})`,
          location: { latitude: userLat - 0.0155, longitude: userLng - 0.0155 }, // ~1700m away
          description: "Fourth test karenderia at 1700m - perfect for range testing",
          rating: 4.3,
          priceRange: 'Moderate' as const,
          cuisine: ['Filipino', 'Grilled Food'],
          contactNumber: "+63 32 444 4444"
        }
      ];

      // Add each karenderia
      for (const karenderia of testKarenderias) {
        await this.addKarenderia_Local(karenderia).toPromise();
      }

      console.log('✅ Successfully added 4 test karenderias to localStorage');
      console.log(`📍 Test Karenderia 1: ${testKarenderias[0].location.latitude}, ${testKarenderias[0].location.longitude} (~110m)`);
      console.log(`📍 Test Karenderia 2: ${testKarenderias[1].location.latitude}, ${testKarenderias[1].location.longitude} (~165m)`);
      console.log(`📍 Test Karenderia 3: ${testKarenderias[2].location.latitude}, ${testKarenderias[2].location.longitude} (~1600m)`);
      console.log(`📍 Test Karenderia 4: ${testKarenderias[3].location.latitude}, ${testKarenderias[3].location.longitude} (~1700m)`);
      
    } catch (error) {
      console.error('Error adding test karenderias to localStorage:', error);
      throw error;
    }
  }

}
