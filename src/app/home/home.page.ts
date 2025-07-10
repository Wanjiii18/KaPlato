import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService, UserProfile } from '../services/user.service';
import { KarenderiaService } from '../services/karenderia.service';
import { User } from '@angular/fire/auth';
import { GeoPoint } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;
  private userSubscription: Subscription | undefined;
  private profileSubscription: Subscription | undefined;
  isLoading = true;
  showMap = false;
  searchQuery = '';
  featuredKarenderias: any[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private karenderiaService: KarenderiaService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      // Handle different auth states properly
      if (user !== undefined) {
        // User is either logged in (user object) or definitely not logged in (null)
        this.currentUser = user;
        this.isLoading = false;
        
        // Check user role and redirect accordingly
        if (user) {
          this.checkUserRoleAndRedirect();
        }
      }
      // Don't redirect here - let the auth guard handle routing
    });

    // Subscribe to user profile changes
    this.profileSubscription = this.userService.currentUserProfile$.subscribe(profile => {
      this.userProfile = profile;
    });

    // Initialize sample karenderia data
    this.initializeKarenderiaData();
    
    // Load featured karenderias
    this.loadFeaturedKarenderias();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  toggleMap() {
    this.showMap = !this.showMap;
    
    // If showing the map, force it to refresh after a short delay
    if (this.showMap) {
      setTimeout(() => {
        // Use the new refresh function
        if ((window as any).refreshMapSize) {
          (window as any).refreshMapSize();
        }
      }, 300);
    }
  }

  private async initializeKarenderiaData() {
    try {
      await this.karenderiaService.seedInitialData();
    } catch (error) {
      console.warn('Could not initialize karenderia data:', error);
    }
  }

  searchKarenderia() {
    // Placeholder for search functionality
    console.log('Search functionality coming soon...');
  }

  async addTestData() {
    try {
      console.log('🔍 Getting your location to place test data nearby...');
      
      // Get your current location first
      const position = await this.getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      console.log(`📍 Your location: ${userLat}, ${userLng}`);
      
      // Clear existing localStorage data and add test data at your location
      await this.karenderiaService.clearAllKarenderias_Local().toPromise();
      await this.karenderiaService.addTestKarenderias_Local(userLat, userLng);
      
      console.log('✅ Test data added successfully to localStorage near your location!');
      console.log('�️ Show the map and test the search functionality');
      
      if (this.showMap) {
        console.log('💡 Map is visible - try using the search controls on the map');
      } else {
        console.log('� Click "Show Map" to test the search functionality');
      }
    } catch (error) {
      console.warn('⚠️ Could not get location, using default Mandaue coordinates');
      try {
        await this.karenderiaService.clearAllKarenderias_Local().toPromise();
        await this.karenderiaService.addTestKarenderias_Local(10.3157, 123.8854); // Mandaue, Cebu
        console.log('✅ Test data added to localStorage at default location (Mandaue, Cebu)');
      } catch (error) {
        console.error('❌ Error adding test data:', error);
      }
    }
  }

  // Method to add test karenderias directly to Firestore
  private async addTestKarenderias(userLat: number, userLng: number): Promise<void> {
    try {
      // Clear existing data
      const allKarenderias = await this.karenderiaService.getAllKarenderias().toPromise();
      if (allKarenderias && allKarenderias.length > 0) {
        console.log('�️ Clearing existing karenderias...');
        for (const k of allKarenderias) {
          if (k.id) {
            await this.karenderiaService.deleteKarenderia(k.id).toPromise();
          }
        }
      }

      // Create 2 test karenderias very close to user location
      const testData1 = {
        name: "Test Karenderia 1",
        address: `Near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
        location: new GeoPoint(userLat + 0.001, userLng + 0.001), // ~110m away
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
      };

      const testData2 = {
        name: "Test Karenderia 2",
        address: `Business area near you (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
        location: new GeoPoint(userLat - 0.0015, userLng + 0.0015), // ~165m away
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
      };

      // Add to Firestore
      await this.karenderiaService.addKarenderia(testData1).toPromise();
      await this.karenderiaService.addKarenderia(testData2).toPromise();

      console.log(`📍 Added Test Karenderia 1 at ${testData1.location.latitude}, ${testData1.location.longitude}`);
      console.log(`📍 Added Test Karenderia 2 at ${testData2.location.latitude}, ${testData2.location.longitude}`);
      
    } catch (error) {
      console.error('Error creating test data:', error);
      throw error;
    }
  }

  // Debug method to check what's in localStorage and your location
  async debugKarenderias() {
    try {
      console.log('🔍 DEBUGGING KARENDERIA SEARCH ISSUE (localStorage):');
      
      // 1. Check what's in localStorage
      const allKarenderias = await this.karenderiaService.getAllKarenderias_Local().toPromise();
      console.log(`📊 Found ${allKarenderias?.length || 0} karenderias in localStorage:`);
      allKarenderias?.forEach((k, i) => {
        console.log(`${i + 1}. ${k.name} at (${k.location.latitude}, ${k.location.longitude})`);
      });

      // 2. Get your current location
      const position = await this.getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      console.log(`📍 Your current location: ${userLat}, ${userLng}`);

      // 3. Calculate distances to all karenderias
      if (allKarenderias && allKarenderias.length > 0) {
        console.log('📏 Distances from your location:');
        allKarenderias.forEach((k) => {
          const distance = this.calculateDistance(userLat, userLng, k.location.latitude, k.location.longitude);
          console.log(`   ${k.name}: ${Math.round(distance)}m away`);
        });
      }

    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }

  // Comprehensive debug method to find the issue
  async troubleshootSearch() {
    console.log('🔧 TROUBLESHOOTING KARENDERIA SEARCH...');
    console.log('================================================');

    try {
      // Step 1: Check localStorage directly
      const rawStorage = localStorage.getItem('kaplato_karenderias');
      console.log('1️⃣ Raw localStorage data:', rawStorage);
      
      if (!rawStorage) {
        console.log('❌ No data in localStorage! Need to add test data first.');
        return;
      }

      // Step 2: Parse the data
      const parsedData = JSON.parse(rawStorage);
      console.log(`2️⃣ Parsed data (${parsedData.length} items):`, parsedData);

      // Step 3: Test service method
      const serviceData = await this.karenderiaService.getAllKarenderias_Local().toPromise();
      console.log(`3️⃣ Service getAllKarenderias_Local (${serviceData?.length || 0} items):`, serviceData);

      // Step 4: Get user location
      let userLat = 10.3157; // Default Mandaue
      let userLng = 123.8854;
      
      try {
        const position = await this.getCurrentPosition();
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
        console.log(`4️⃣ User location: ${userLat}, ${userLng}`);
      } catch (error) {
        console.log('4️⃣ Using default location (Mandaue):', userLat, userLng);
      }

      // Step 5: Test search with different ranges
      console.log('5️⃣ Testing search with different ranges:');
      const ranges = [500, 1000, 2000, 5000];
      
      for (const range of ranges) {
        const results = await this.karenderiaService.getNearbyKarenderias_Local(userLat, userLng, range).toPromise();
        console.log(`   📍 ${range}m search: ${results?.length || 0} results`);
        
        if (results && results.length > 0) {
          results.forEach((k, i) => {
            console.log(`      ${i + 1}. ${k.name} - ${Math.round(k.distance || 0)}m away`);
          });
        }
      }

      // Step 6: Manual distance calculation to verify
      if (serviceData && serviceData.length > 0) {
        console.log('6️⃣ Manual distance verification:');
        serviceData.forEach((k) => {
          const distance = this.calculateDistance(userLat, userLng, k.location.latitude, k.location.longitude);
          console.log(`   ${k.name}: Manual calc = ${Math.round(distance)}m`);
        });
      }

      console.log('================================================');
      console.log('✅ Troubleshooting complete - check results above');

    } catch (error) {
      console.error('❌ Troubleshooting error:', error);
    }
  }

  // Simple test to verify localStorage is working
  testLocalStorage() {
    console.log('🧪 Testing localStorage functionality...');
    
    // Test basic localStorage
    try {
      localStorage.setItem('test', 'hello');
      const value = localStorage.getItem('test');
      console.log('✅ Basic localStorage works:', value);
      localStorage.removeItem('test');
    } catch (error) {
      console.error('❌ Basic localStorage failed:', error);
      return;
    }

    // Test the karenderia storage key
    const karenderiaData = localStorage.getItem('kaplato_karenderias');
    console.log('📦 Current karenderia data:', karenderiaData);
    
    if (karenderiaData) {
      try {
        const parsed = JSON.parse(karenderiaData);
        console.log('✅ Karenderia data is valid JSON:', parsed);
        console.log(`📊 Found ${parsed.length} karenderias in storage`);
      } catch (error) {
        console.error('❌ Karenderia data is corrupted:', error);
        localStorage.removeItem('kaplato_karenderias');
        console.log('🧹 Cleaned up corrupted data');
      }
    } else {
      console.log('ℹ️ No karenderia data found - need to add test data');
    }
  }

  // Dashboard Methods
  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    if (this.searchQuery.length > 2) {
      this.performSearch();
    }
  }

  async performSearch() {
    const toast = await this.toastController.create({
      message: `Searching for "${this.searchQuery}"...`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  searchNearby() {
    console.log('🔍 Searching for nearby karenderias...');
    this.showMap = true;
    // The map component will handle the actual search
  }

  async showFavorites() {
    const toast = await this.toastController.create({
      message: 'Favorites feature coming soon! ❤️',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async showRecommended() {
    const toast = await this.toastController.create({
      message: 'Popular karenderias feature coming soon! ⭐',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async showCategories() {
    const toast = await this.toastController.create({
      message: 'Categories view coming soon! 🍽️',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async viewAllFeatured() {
    const toast = await this.toastController.create({
      message: 'View all featured karenderias coming soon!',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async searchByCategory(category: string) {
    const toast = await this.toastController.create({
      message: `Searching for ${category} restaurants...`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private loadFeaturedKarenderias() {
    // Sample featured karenderias data
    this.featuredKarenderias = [
      {
        name: "Lola Rosa's Kitchen",
        address: "123 Main St, Quezon City",
        location: { latitude: 14.6760, longitude: 121.0437 },
        rating: 4.8,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Traditional']
      },
      {
        name: "Tita Neng's Lutong Bahay",
        address: "456 Food Ave, Manila",
        location: { latitude: 14.5995, longitude: 120.9842 },
        rating: 4.6,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Home-cooked']
      },
      {
        name: "Kuya Jun's BBQ House",
        address: "789 Grill St, Makati",
        location: { latitude: 14.5547, longitude: 121.0244 },
        rating: 4.7,
        priceRange: 'Moderate',
        cuisine: ['BBQ', 'Grilled']
      }
    ];
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    });
  }

  // Calculate distance between two points (Haversine formula)
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

  async logout() {
    await this.authService.logout();
  }

  goToApplicationPage() {
    this.router.navigate(['/karenderia-application']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  clearTestData() {
    this.karenderiaService.clearAllKarenderias_Local();
    console.log('🗑️ Cleared all test data from localStorage');
    console.log('ℹ️ You can now add fresh test data if needed');
  }

  private checkUserRoleAndRedirect() {
    this.userService.currentUserProfile$.subscribe(profile => {
      if (profile) {
        if (profile.role === 'karenderia_owner') {
          // Redirect karenderia owners to their dashboard
          this.router.navigate(['/karenderia-dashboard']);
        }
        // Regular users stay on home page
      }
    });
  }
}
