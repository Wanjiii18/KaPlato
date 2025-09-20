import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { KarenderiaService } from './karenderia.service';
import { Karenderia } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class KarenderiaInfoService {
  private currentKarenderiaSubject = new BehaviorSubject<Karenderia | null>(null);
  public currentKarenderia$ = this.currentKarenderiaSubject.asObservable();

  constructor(private karenderiaService: KarenderiaService) {
    // Load data immediately if user is already logged in
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      console.log('🔄 User already logged in, loading karenderia data...');
      this.loadKarenderiaData();
    }
  }

  async loadKarenderiaData() {
    try {
      console.log('🔍 KarenderiaInfoService: Attempting to load karenderia data from backend...');
      
      // Check if user is logged in
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
<<<<<<< Updated upstream
        console.warn('🚫 No auth token found, user not logged in');
=======
        console.log('🔍 No auth token found, using fallback data');
>>>>>>> Stashed changes
        this.setFallbackData();
        return;
      }
      
<<<<<<< Updated upstream
      console.log('✅ Auth token found, making API call...');
      
=======
      console.log('🔍 Loading karenderia data from backend...');
>>>>>>> Stashed changes
      // Try to get real data from backend
      const karenderiaData = await this.karenderiaService.getCurrentUserKarenderia().toPromise();
      console.log('📡 API Response:', karenderiaData);
      
      console.log('🔍 Backend response:', karenderiaData);
      
      if (karenderiaData && karenderiaData.success && karenderiaData.data) {
<<<<<<< Updated upstream
        console.log('✅ Successfully loaded karenderia data:', karenderiaData.data.name);
        this.currentKarenderiaSubject.next(karenderiaData.data);
        return;
      } else {
        console.warn('⚠️ API returned unsuccessful response:', karenderiaData);
=======
        console.log('✅ Successfully loaded karenderia:', karenderiaData.data.business_name || karenderiaData.data.name);
        this.currentKarenderiaSubject.next(karenderiaData.data);
        return;
      } else {
        console.warn('⚠️ Backend returned unsuccessful response or no data');
>>>>>>> Stashed changes
      }
    } catch (error) {
      console.error('❌ Error loading karenderia from backend:', error);
      if (error.status === 404) {
        console.log('📝 No karenderia application found for this user');
      }
    }

    // Fallback to mock data if API call fails
<<<<<<< Updated upstream
    console.log('🔄 Using fallback mock data...');
=======
    console.log('🔄 Using fallback data');
>>>>>>> Stashed changes
    this.setFallbackData();
  }

  private setFallbackData() {
    // Check if user is logged in and what role they have
    const userData = sessionStorage.getItem('user_data');
    let userName = 'Your';
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userName = user.name || 'Your';
      } catch (e) {
        console.warn('Could not parse user data');
      }
    }

    const mockKarenderia: Karenderia = {
      id: '1',
      name: `${userName}'s Karenderia`,
      business_name: `${userName}'s Kitchen Business`,
      description: 'Welcome to your karenderia! Please update your business information in settings.',
      address: 'Please update your address in settings',
      owner_id: 'current-user-id',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.currentKarenderiaSubject.next(mockKarenderia);
  }

  getCurrentKarenderia(): Karenderia | null {
    return this.currentKarenderiaSubject.value;
  }

  getKarenderiaDisplayName(): string {
    const karenderia = this.getCurrentKarenderia();
    if (!karenderia) {
      // Check if user is logged in
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        return 'KaPlato Kitchen'; // Default for non-logged-in users
      }
      return 'Loading...'; // Loading state for logged-in users
    }
<<<<<<< Updated upstream
    return karenderia.business_name || karenderia.name || 'Your Karenderia';
=======
    
    // Prioritize business_name over name, with fallback
    const displayName = karenderia.business_name || karenderia.name || 'Your Karenderia';
    console.log('🏪 Displaying karenderia name:', displayName);
    return displayName;
>>>>>>> Stashed changes
  }

  getKarenderiaBrandInitials(): string {
    const name = this.getKarenderiaDisplayName();
    if (name === 'Loading...') return '...';
    if (name === 'KaPlato Kitchen') return 'KP';
    
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'YK';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  // Method to update karenderia data (for settings page, etc.)
  updateKarenderiaData(karenderia: Karenderia) {
    this.currentKarenderiaSubject.next(karenderia);
  }

  // Method to reload karenderia data (call after login)
  async reloadKarenderiaData() {
    await this.loadKarenderiaData();
  }
}
