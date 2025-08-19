import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { KarenderiaService } from '../services/karenderia.service';
import { GestureController } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.page.html',
  styleUrls: ['./map-view.page.scss'],
  standalone: false,
})
export class MapViewPage implements OnInit {
  @ViewChild('listWrapper', { read: ElementRef }) listWrapper!: ElementRef;

  searchQuery = '';
  selectedFilter = 'all';
  showList = true; // Show list by default
  karenderias: any[] = [];
  filteredKarenderias: any[] = [];
  userLocation: any = null;
  
  // Map properties
  currentLat = 14.5995; // Default to Manila coordinates
  currentLng = 120.9842;
  mapZoom = 13;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private karenderiaService: KarenderiaService,
    private gestureCtrl: GestureController,
    private location: Location
  ) {}

  ngOnInit() {
    console.log('🗺️ Map view initializing...');
    console.log('🗺️ Current URL:', this.router.url);
    
    // Ensure we stay on the map-view route
    if (this.router.url !== '/map-view') {
      console.log('⚠️ URL mismatch detected, ensuring we stay on map-view');
      this.router.navigateByUrl('/map-view', { replaceUrl: true });
    }
    
    this.loadKarenderias();
    this.getCurrentLocation();
    this.addSwipeGesture();
    
    // Debug info after a short delay to ensure data is loaded
    setTimeout(() => {
      console.log('🔍 DEBUG INFO:');
      console.log('📊 Total karenderias:', this.karenderias.length);
      console.log('📋 Filtered karenderias:', this.filteredKarenderias.length);
      console.log('🔤 Search query:', this.searchQuery);
      console.log('🏷️ Selected filter:', this.selectedFilter);
      console.log('👀 Show list:', this.showList);
    }, 1000);
  }

  goBack() {
    console.log('🔙 Going back to home page...');
    // Try to go back in history first
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // If no history, navigate directly to home
      this.router.navigate(['/home']);
    }
  }

  toggleListView() {
    this.showList = !this.showList;
  }

  addSwipeGesture() {
    const gesture = this.gestureCtrl.create({
      el: this.listWrapper.nativeElement,
      gestureName: 'swipe',
      onMove: (ev) => {
        if (ev.deltaY > 50) {
          this.showList = false; // Close the list on downward swipe
        }
      },
    });
    gesture.enable();
  }

  async loadKarenderias() {
    console.log('🔍 Loading karenderias for map view...');
    
    try {
      // First try to load from localStorage (test data)
      this.karenderiaService.getAllKarenderias_Local().subscribe({
        next: (localData) => {
          console.log('📱 Local storage data:', localData);
          if (localData && localData.length > 0) {
            this.karenderias = localData.map(k => ({
              id: k.id,
              name: k.name,
              cuisine: k.cuisine?.join(', ') || 'Filipino',
              address: k.address,
              rating: k.rating || 4.5,
              isOpen: true, // Default to open
              deliveryTime: '20-30 min',
              distance: 300,
              latitude: k.location?.latitude || 10.3157,
              longitude: k.location?.longitude || 123.8854
            }));
            this.filteredKarenderias = [...this.karenderias];
            console.log('✅ Loaded from localStorage:', this.karenderias.length, 'karenderias');
            this.applyFilter();
            return;
          }
          
          // If no local data, try backend
          this.loadFromBackend();
        },
        error: (error) => {
          console.error('❌ Error loading from localStorage:', error);
          this.loadFromBackend();
        }
      });
    } catch (error) {
      console.error('❌ Error in loadKarenderias:', error);
      this.loadFromBackend();
    }
  }

  loadFromBackend() {
    console.log('🌐 Loading from backend...');
    this.karenderiaService.getAllKarenderias().subscribe({
      next: (response) => {
        console.log('🌐 Backend response:', response);
        if (response && response.length > 0) {
          this.karenderias = response.map(k => ({
            id: k.id,
            name: k.name,
            cuisine: k.cuisine?.join(', ') || 'Filipino',
            address: k.address,
            rating: k.rating || k.average_rating || 4.5,
            isOpen: true, // Default to open
            deliveryTime: `30 min`,
            distance: 300,
            latitude: k.location?.latitude || 10.3157,
            longitude: k.location?.longitude || 123.8854
          }));
          this.filteredKarenderias = [...this.karenderias];
          console.log('✅ Loaded from backend:', this.karenderias.length, 'karenderias');
        } else {
          console.log('⚠️ No backend data, loading mock data...');
          this.loadMockData();
        }
        this.applyFilter();
      },
      error: (error) => {
        console.error('❌ Backend error, loading mock data:', error);
        this.loadMockData();
      }
    });
  }

  loadMockData() {
    console.log('📋 Loading mock data for karenderias...');
    this.karenderias = [
      {
        id: 1,
        name: "Lola Rosa's Kitchen",
        cuisine: 'Filipino Traditional',
        address: '123 Main St, Cebu City',
        rating: 4.8,
        isOpen: true,
        deliveryTime: '15-25 min',
        distance: 250,
        latitude: 10.3157,
        longitude: 123.8854
      },
      {
        id: 2,
        name: "Tita Nena's Lutong Bahay",
        cuisine: 'Filipino Home-cooked',
        address: '456 Colon St, Cebu City',
        rating: 4.6,
        isOpen: true,
        deliveryTime: '20-30 min',
        distance: 180,
        latitude: 10.2968,
        longitude: 123.8914
      },
      {
        id: 3,
        name: "Kuya Jun's BBQ House",
        cuisine: 'BBQ Grilled',
        address: '789 Lahug, Cebu City',
        rating: 4.7,
        isOpen: false,
        deliveryTime: '25-35 min',
        distance: 420,
        latitude: 10.3369,
        longitude: 123.9139
      },
      {
        id: 4,
        name: "Ate Linda's Carinderia",
        cuisine: 'Filipino Budget Meals',
        address: '321 IT Park, Cebu City',
        rating: 4.4,
        isOpen: true,
        deliveryTime: '18-28 min',
        distance: 320,
        latitude: 10.3200,
        longitude: 123.9000
      }
    ];
    this.filteredKarenderias = [...this.karenderias];
    console.log('✅ Mock data loaded:', this.karenderias.length, 'karenderias');
    console.log('📊 Mock karenderias:', this.karenderias);
  }

  onSearchChange() {
    this.applyFilter();
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    console.log('🔍 Applying filters...');
    console.log('📊 Total karenderias:', this.karenderias.length);
    console.log('🔤 Search query:', this.searchQuery);
    console.log('🏷️ Selected filter:', this.selectedFilter);
    
    let filtered = [...this.karenderias];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(query) ||
        k.cuisine.toLowerCase().includes(query) ||
        k.address.toLowerCase().includes(query)
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Apply category filter
    switch (this.selectedFilter) {
      case 'open':
        filtered = filtered.filter(k => k.isOpen);
        console.log('🏪 After "open" filter:', filtered.length);
        break;
      case 'nearby':
        filtered = filtered.filter(k => k.distance && k.distance < 500);
        console.log('📍 After "nearby" filter:', filtered.length);
        break;
      case 'rating':
        filtered = filtered.filter(k => k.rating >= 4.5);
        console.log('⭐ After "rating" filter:', filtered.length);
        break;
      case 'all':
      default:
        console.log('📋 No category filter applied');
        break;
    }

    this.filteredKarenderias = filtered;
    console.log('✅ Final filtered karenderias:', this.filteredKarenderias.length);
    console.log('📋 Filtered list:', this.filteredKarenderias);
  }

  selectKarenderia(karenderia: any) {
    // Navigate to karenderia detail page with menu
    console.log('Selected karenderia:', karenderia);
    console.log('🏪 Navigating to karenderia detail page...');
    
    // Use the karenderia ID or create one if it doesn't exist
    const karenderiaId = karenderia.id || karenderia.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    this.router.navigate(['/karenderia-detail', karenderiaId], {
      state: { karenderia: karenderia }
    });
  }

  async centerOnUserLocation() {
    const loading = await this.loadingController.create({
      message: 'Getting your location...',
      duration: 2000
    });
    await loading.present();

    this.getCurrentLocation();
    await loading.dismiss();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        },
        (error) => {
          console.error('Error getting location:', error);
          this.showToast('Unable to get your location');
        }
      );
    } else {
      this.showToast('Geolocation is not supported');
    }
  }

  refreshLocation() {
    this.getCurrentLocation();
    this.loadKarenderias();
    this.showToast('Location refreshed');
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}