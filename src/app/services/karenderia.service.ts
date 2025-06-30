import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, GeoPoint } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

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
}

@Injectable({
  providedIn: 'root'
})
export class KarenderiaService {
  private karenderiaCollection = collection(this.firestore, 'karenderias');

  constructor(private firestore: Firestore) {}

  // Get all karenderias
  getAllKarenderias(): Observable<Karenderia[]> {
    return new Observable(observer => {
      getDocs(this.karenderiaCollection).then(snapshot => {
        const karenderias = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Karenderia));
        observer.next(karenderias);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Get karenderias within a radius (simplified version)
  // Note: For production, you'd want to use more sophisticated geospatial queries
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

  // Add a new karenderia
  addKarenderia(karenderia: Omit<Karenderia, 'id'>): Observable<string> {
    const karenderiaData = {
      ...karenderia,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return from(addDoc(this.karenderiaCollection, karenderiaData)).pipe(
      map(docRef => docRef.id)
    );
  }

  // Update a karenderia
  updateKarenderia(id: string, updates: Partial<Karenderia>): Observable<void> {
    const karenderiaDoc = doc(this.firestore, 'karenderias', id);
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    return from(updateDoc(karenderiaDoc, updateData));
  }

  // Delete a karenderia
  deleteKarenderia(id: string): Observable<void> {
    const karenderiaDoc = doc(this.firestore, 'karenderias', id);
    return from(deleteDoc(karenderiaDoc));
  }

  // Calculate distance between two points using Haversine formula
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

  // Seed initial data (for testing purposes)
  async seedInitialData(): Promise<void> {
    try {
      // Check if data already exists
      const snapshot = await getDocs(this.karenderiaCollection);
      if (!snapshot.empty) {
        console.log('Karenderia data already exists');
        return;
      }

      // Sample karenderias in Manila area
      const sampleKarenderias: Omit<Karenderia, 'id'>[] = [
        {
          name: 'Lola Rosa\'s Karenderia',
          address: 'Taft Avenue, Manila',
          location: new GeoPoint(14.5881, 120.9835),
          description: 'Traditional Filipino home-cooked meals',
          rating: 4.2,
          priceRange: 'Budget',
          cuisine: ['Filipino', 'Traditional'],
          contactNumber: '+63 912 345 6789',
          openingHours: {
            monday: { open: '06:00', close: '21:00' },
            tuesday: { open: '06:00', close: '21:00' },
            wednesday: { open: '06:00', close: '21:00' },
            thursday: { open: '06:00', close: '21:00' },
            friday: { open: '06:00', close: '21:00' },
            saturday: { open: '06:00', close: '21:00' },
            sunday: { open: '07:00', close: '20:00' }
          }
        },
        {
          name: 'Tita Neng\'s Eatery',
          address: 'Espana Boulevard, Manila',
          location: new GeoPoint(14.6042, 120.9822),
          description: 'Affordable Filipino comfort food',
          rating: 4.0,
          priceRange: 'Budget',
          cuisine: ['Filipino', 'Comfort Food'],
          contactNumber: '+63 917 234 5678',
          openingHours: {
            monday: { open: '05:30', close: '22:00' },
            tuesday: { open: '05:30', close: '22:00' },
            wednesday: { open: '05:30', close: '22:00' },
            thursday: { open: '05:30', close: '22:00' },
            friday: { open: '05:30', close: '22:00' },
            saturday: { open: '05:30', close: '22:00' },
            sunday: { open: '06:00', close: '21:00' }
          }
        },
        {
          name: 'Kuya Jun\'s Food House',
          address: 'Recto Avenue, Manila',
          location: new GeoPoint(14.6067, 120.9736),
          description: 'Popular among students and workers',
          rating: 3.8,
          priceRange: 'Budget',
          cuisine: ['Filipino', 'Rice Meals'],
          contactNumber: '+63 905 123 4567',
          openingHours: {
            monday: { open: '06:00', close: '20:00' },
            tuesday: { open: '06:00', close: '20:00' },
            wednesday: { open: '06:00', close: '20:00' },
            thursday: { open: '06:00', close: '20:00' },
            friday: { open: '06:00', close: '20:00' },
            saturday: { open: '06:00', close: '20:00' },
            sunday: { open: '', close: '', closed: true }
          }
        },
        {
          name: 'Ate Marie\'s Kitchen',
          address: 'Malate, Manila',
          location: new GeoPoint(14.5764, 120.9851),
          description: 'Home-style Filipino dishes',
          rating: 4.5,
          priceRange: 'Moderate',
          cuisine: ['Filipino', 'Homestyle'],
          contactNumber: '+63 920 876 5432',
          openingHours: {
            monday: { open: '07:00', close: '21:00' },
            tuesday: { open: '07:00', close: '21:00' },
            wednesday: { open: '07:00', close: '21:00' },
            thursday: { open: '07:00', close: '21:00' },
            friday: { open: '07:00', close: '21:00' },
            saturday: { open: '07:00', close: '21:00' },
            sunday: { open: '07:00', close: '21:00' }
          }
        },
        {
          name: 'Bahay Kubo Restaurant',
          address: 'Ermita, Manila',
          location: new GeoPoint(14.5849, 120.9758),
          description: 'Authentic Filipino cuisine in a cozy setting',
          rating: 4.3,
          priceRange: 'Moderate',
          cuisine: ['Filipino', 'Authentic'],
          contactNumber: '+63 918 765 4321',
          openingHours: {
            monday: { open: '08:00', close: '22:00' },
            tuesday: { open: '08:00', close: '22:00' },
            wednesday: { open: '08:00', close: '22:00' },
            thursday: { open: '08:00', close: '22:00' },
            friday: { open: '08:00', close: '22:00' },
            saturday: { open: '08:00', close: '22:00' },
            sunday: { open: '08:00', close: '22:00' }
          }
        },
        {
          name: 'Sari-Sari Karenderia',
          address: 'Binondo, Manila',
          location: new GeoPoint(14.5979, 120.9739),
          description: 'Variety of Filipino dishes at great prices',
          rating: 3.9,
          priceRange: 'Budget',
          cuisine: ['Filipino', 'Variety'],
          contactNumber: '+63 922 345 6789',
          openingHours: {
            monday: { open: '05:00', close: '20:00' },
            tuesday: { open: '05:00', close: '20:00' },
            wednesday: { open: '05:00', close: '20:00' },
            thursday: { open: '05:00', close: '20:00' },
            friday: { open: '05:00', close: '20:00' },
            saturday: { open: '05:00', close: '20:00' },
            sunday: { open: '06:00', close: '19:00' }
          }
        }
      ];

      // Add sample data
      for (const karenderia of sampleKarenderias) {
        await addDoc(this.karenderiaCollection, {
          ...karenderia,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('Sample karenderia data added successfully');
    } catch (error) {
      console.error('Error seeding karenderia data:', error);
    }
  }
}