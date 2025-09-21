import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KarenderiaService } from '../services/karenderia.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-karenderias-browse',
  templateUrl: './karenderias-browse.page.html',
  styleUrls: ['./karenderias-browse.page.scss'],
  standalone: false,
})
export class KarenderiasBrowsePage implements OnInit {
  karenderias: any[] = [];
  filteredKarenderias: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedCategory = 'all';
  selectedSort = 'rating';
  
  // User location for distance calculation
  userLocation: { latitude: number; longitude: number } | null = null;

  categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'open', name: 'Open Now', icon: 'checkmark-circle-outline' },
    { id: 'nearby', name: 'Nearby', icon: 'location-outline' },
    { id: 'popular', name: 'Popular', icon: 'star-outline' },
    { id: 'budget', name: 'Budget-Friendly', icon: 'cash-outline' }
  ];

  sortOptions = [
    { id: 'rating', name: 'Rating' },
    { id: 'distance', name: 'Distance' },
    { id: 'name', name: 'Name' }
  ];

  constructor(
    private router: Router,
    private karenderiaService: KarenderiaService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.getUserLocation().then(() => {
      this.loadKarenderias();
    });
  }

  async getUserLocation(): Promise<void> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      
      this.userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      console.log('📍 User location obtained:', this.userLocation);
    } catch (error) {
      console.warn('⚠️ Could not get user location, using default:', error);
      // Default to Mandaue City, Cebu if location access fails
      this.userLocation = { latitude: 10.3157, longitude: 123.9349 };
    }
  }

  async loadKarenderias() {
    try {
      console.log('🔍 Attempting to load karenderias from backend API...');
      
      // Load karenderias from backend API
      this.karenderiaService.getAllKarenderias().subscribe({
        next: (karenderias) => {
          console.log('📡 Backend response received:', karenderias);
          
          if (karenderias && karenderias.length > 0) {
            console.log('✅ Found', karenderias.length, 'karenderias from backend');
            
            this.karenderias = karenderias.map(k => {
              const distance = this.calculateRealDistance(
                k.location?.latitude || k.latitude || 10.3157, 
                k.location?.longitude || k.longitude || 123.9349
              );
              
              console.log(`📍 ${k.name}: distance = ${distance}km, location = (${k.location?.latitude || k.latitude}, ${k.location?.longitude || k.longitude})`);
              
              return {
                id: k.id,
                name: k.name || 'Unknown Karenderia',
                address: k.address || 'No address',
                location: { 
                  latitude: k.location?.latitude || k.latitude || 10.3157, 
                  longitude: k.location?.longitude || k.longitude || 120.9842 
                },
                rating: k.rating || k.average_rating || 4.0,
                priceRange: 'Budget',
                cuisine: ['Filipino', 'Traditional'],
                deliveryTime: k.deliveryTime || `${k.delivery_time_minutes || 30} min`,
                deliveryFee: k.deliveryFee || 25,
                isOpen: k.isOpen !== undefined ? k.isOpen : true,
                imageUrl: k.imageUrl || 'assets/images/karenderia-placeholder.jpg',
                distance: distance
              };
            });
            
            console.log('✅ Loaded karenderias from backend:', this.karenderias.length);
            console.log('📋 User location:', this.userLocation);
          } else {
            console.warn('⚠️ Backend returned empty array, loading mock data');
            this.loadMockKarenderias();
          }
          this.applyFilters();
        },
        error: (error) => {
          console.error('❌ Error loading karenderias from backend:', error);
          console.log('📋 Falling back to mock data');
          this.loadMockKarenderias();
          this.applyFilters();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Error in loadKarenderias:', error);
      this.loadMockKarenderias();
      this.applyFilters();
      this.isLoading = false;
    }
  }

  loadMockKarenderias() {
    // Fallback mock data for demonstration
    this.karenderias = [
      {
        id: 'mock-1',
        name: "Lola Maria's Kitchen",
        address: "123 Mabini Street, Mandaue City, Cebu",
        location: { latitude: 10.3231, longitude: 123.9319 },
        rating: 4.8,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Traditional'],
        deliveryTime: '25 min',
        deliveryFee: 20,
        isOpen: true,
        imageUrl: 'assets/images/karenderia1.jpg',
        distance: this.calculateRealDistance(10.3231, 123.9319)
      },
      {
        id: 'mock-2',
        name: "Tita Linda's Lutong Bahay",
        address: "456 Plaridel Street, Mandaue City, Cebu",
        location: { latitude: 10.3241, longitude: 123.9329 },
        rating: 4.6,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Home-cooked'],
        deliveryTime: '30 min',
        deliveryFee: 25,
        isOpen: true,
        imageUrl: 'assets/images/karenderia2.jpg',
        distance: this.calculateRealDistance(10.3241, 123.9329)
      },
      {
        id: 'mock-3',
        name: "Kuya Roberto's Place",
        address: "789 Burgos Street, Mandaue City, Cebu",
        location: { latitude: 10.3221, longitude: 123.9309 },
        rating: 4.4,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Grilled'],
        deliveryTime: '35 min',
        deliveryFee: 30,
        isOpen: false,
        imageUrl: 'assets/images/karenderia3.jpg',
        distance: this.calculateRealDistance(10.3221, 123.9309)
      },
      {
        id: 'mock-4',
        name: "Nanay Cora's Carinderia",
        address: "321 Rizal Avenue, Mandaue City, Cebu",
        location: { latitude: 10.3251, longitude: 123.9339 },
        rating: 4.7,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Seafood'],
        deliveryTime: '28 min',
        deliveryFee: 22,
        isOpen: true,
        imageUrl: 'assets/images/karenderia4.jpg',
        distance: this.calculateRealDistance(10.3251, 123.9339)
      }
    ];
    console.log('📋 Loaded mock karenderias:', this.karenderias.length);
  }

  calculateRealDistance(karenderiaLat: number, karenderiaLng: number): number {
    if (!this.userLocation) {
      return 0; // Return 0 if no user location available
    }
    
    // Haversine formula to calculate distance in kilometers
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.userLocation.latitude * Math.PI / 180;
    const φ2 = karenderiaLat * Math.PI / 180;
    const Δφ = (karenderiaLat - this.userLocation.latitude) * Math.PI / 180;
    const Δλ = (karenderiaLng - this.userLocation.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distanceInMeters = R * c;
    const distanceInKm = distanceInMeters / 1000;
    
    // Round to 1 decimal place
    return Math.round(distanceInKm * 10) / 10;
  }

  onSearchChange() {
    this.applyFilters();
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.karenderias];
    console.log('🔍 Starting filters with', filtered.length, 'karenderias');

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(query) ||
        k.address.toLowerCase().includes(query) ||
        k.cuisine.some((c: string) => c.toLowerCase().includes(query))
      );
      console.log('🔍 After search filter:', filtered.length, 'karenderias');
    }

    // Apply category filter
    switch (this.selectedCategory) {
      case 'open':
        filtered = filtered.filter(k => k.isOpen);
        console.log('🔍 After open filter:', filtered.length, 'karenderias');
        break;
      case 'nearby':
        console.log('🔍 Applying nearby filter (<=1.0km)...');
        filtered.forEach(k => {
          console.log(`   📍 ${k.name}: ${k.distance}km (${k.distance <= 1.0 ? 'NEARBY' : 'TOO FAR'})`);
        });
        filtered = filtered.filter(k => k.distance <= 1.0);
        console.log('🔍 After nearby filter:', filtered.length, 'karenderias');
        break;
      case 'popular':
        filtered = filtered.filter(k => k.rating >= 4.5);
        console.log('🔍 After popular filter:', filtered.length, 'karenderias');
        break;
      case 'budget':
        filtered = filtered.filter(k => k.priceRange === 'Budget');
        console.log('🔍 After budget filter:', filtered.length, 'karenderias');
        break;
    }

    // Apply sorting
    switch (this.selectedSort) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.filteredKarenderias = filtered;
    console.log(`🔍 Final result: ${filtered.length} karenderias found`);
  }

  async selectKarenderia(karenderia: any) {
    console.log('🏪 Selected karenderia:', karenderia.name);
    
    try {
      // Navigate to karenderia detail page with the karenderia data
      await this.router.navigate(['/karenderia-detail', karenderia.id], {
        state: { karenderia: karenderia }
      });
      
      console.log('✅ Successfully navigated to karenderia detail page');
    } catch (error) {
      console.error('❌ Error navigating to karenderia detail:', error);
      await this.showToast('Unable to view karenderia menu at this time');
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
