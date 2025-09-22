import { Component, OnInit, AfterViewInit, ViewChild, ElementRef  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { KarenderiaService } from '../services/karenderia.service';
import { GestureController } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.page.html',
  styleUrls: ['./map-view.page.scss'],
  standalone: false,
})
export class MapViewPage implements OnInit, AfterViewInit {
  @ViewChild('listWrapper', { read: ElementRef }) listWrapper!: ElementRef;

  searchQuery = '';
  selectedFilter = 'all';
  showList = true; // Show list by default
  karenderias: any[] = [];
  filteredKarenderias: any[] = [];
  userLocation: any = null;
  
  // Location picker properties
  isLocationPickerMode = false;
  returnTo = '';
  selectedLocation: { lat: number; lng: number } | null = null;
  
  // Map properties
  currentLat = 10.3234; // Default to Cebu coordinates where karenderias are located
  currentLng = 123.9312;
  mapZoom = 13;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private karenderiaService: KarenderiaService,
    private gestureCtrl: GestureController,
    private location: Location
  ) {}

  ngOnInit() {
    // Check for location picker mode from query parameters
    this.route.queryParams.subscribe(params => {
      this.isLocationPickerMode = params['mode'] === 'location-picker';
      this.returnTo = params['returnTo'] || '';
      
      if (this.isLocationPickerMode) {
        this.showList = false; // Hide list in location picker mode
        this.mapZoom = 15; // Zoom in more for precise location picking
      }
    });
    
    // Ensure we stay on the map-view route
    if (this.router.url.split('?')[0] !== '/map-view') {
      this.router.navigateByUrl('/map-view', { replaceUrl: true });
    }
    
    // Only get location and load karenderias if NOT in location picker mode
    if (!this.isLocationPickerMode) {
      this.getCurrentLocation();
    }
  }

  ngAfterViewInit() {
    // Only access DOM elements after the view is initialized
    if (!this.isLocationPickerMode) {
      this.addSwipeGesture();
    }
  }

  goBack() {
    if (this.isLocationPickerMode && this.returnTo) {
      // Return to the specific page that opened the location picker
      this.router.navigate([`/${this.returnTo}`]);
    } else {
      // Try to go back in history first
      if (window.history.length > 1) {
        this.location.back();
      } else {
        // If no history, navigate directly to home
        this.router.navigate(['/home']);
      }
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
    // Skip loading karenderias if in location picker mode
    if (this.isLocationPickerMode) {
      return;
    }
    
    try {
      // If we have user location, search nearby karenderias
      if (this.userLocation) {
        this.searchNearbyKarenderias(this.userLocation.latitude, this.userLocation.longitude, 5000);
        return;
      }
      
      // If no user location, use Cebu coordinates as default
      this.searchNearbyKarenderias(10.3234, 123.9312, 5000);
      
    } catch (error) {
      this.loadMockData();
    }
  }

  searchNearbyKarenderias(lat: number, lng: number, radius: number) {
    // Skip API call if in location picker mode
    if (this.isLocationPickerMode) {
      return;
    }
    
    this.karenderiaService.getNearbyKarenderias(lat, lng, radius).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.karenderias = response.map(k => ({
            id: k.id,
            name: k.name,
            cuisine: k.cuisine?.join(', ') || 'Filipino',
            address: k.address,
            rating: k.rating || 4.5,
            isOpen: true,
            deliveryTime: '20-30 min',
            distance: k.distance || 300,
            latitude: k.location?.latitude || 10.3157,
            longitude: k.location?.longitude || 123.8854
          }));
          this.filteredKarenderias = [...this.karenderias];
          this.applyFilter();
        } else {
          this.loadMockData();
        }
      },
      error: (error) => {
        this.loadMockData();
      }
    });
  }

  loadFromBackend() {
    this.karenderiaService.getAllKarenderias().subscribe({
      next: (response) => {
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
        } else {
          this.loadMockData();
        }
        this.applyFilter();
      },
      error: (error) => {
        this.loadMockData();
      }
    });
  }

  loadMockData() {
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
  }

  onSearchChange() {
    this.applyFilter();
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    let filtered = [...this.karenderias];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(query) ||
        k.cuisine.toLowerCase().includes(query) ||
        k.address.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (this.selectedFilter) {
      case 'open':
        filtered = filtered.filter(k => k.isOpen);
        break;
      case 'nearby':
        filtered = filtered.filter(k => k.distance && k.distance < 500);
        break;
      case 'rating':
        filtered = filtered.filter(k => k.rating >= 4.5);
        break;
      case 'all':
      default:
        break;
    }

    this.filteredKarenderias = filtered;
  }

  selectKarenderia(karenderia: any) {
    // Navigate to karenderia detail page with menu
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
          // Only reload karenderias if not in location picker mode
          if (!this.isLocationPickerMode) {
            this.loadKarenderias();
          }
        },
        (error) => {
          this.showToast('Unable to get your location');
          // Only load karenderias if not in location picker mode
          if (!this.isLocationPickerMode) {
            this.loadKarenderias();
          }
        }
      );
    } else {
      this.showToast('Geolocation is not supported');
      // Only load karenderias if not in location picker mode
      if (!this.isLocationPickerMode) {
        this.loadKarenderias();
      }
    }
  }

  refreshLocation() {
    this.getCurrentLocation();
    this.loadKarenderias();
    this.showToast('Location refreshed');
  }

  clearRoutes() {
    // Call the global clearRoute function that's set up by the map component
    if ((window as any).clearRoute) {
      (window as any).clearRoute();
    } else {
      this.showToast('No active route to clear');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  // Location picker specific methods
  private clickCount = 0;
  private clickTimer: any = null;

  onMapClick(event: { lat: number; lng: number }) {
    if (!this.isLocationPickerMode) {
      return;
    }

    this.clickCount++;
    
    if (this.clickCount === 1) {
      // Single click - start timer
      this.clickTimer = setTimeout(() => {
        // Single click timeout - show preview
        this.showLocationPreview(event.lat, event.lng);
        this.clickCount = 0;
      }, 300);
    } else if (this.clickCount === 2) {
      // Double click - clear timer and handle selection
      clearTimeout(this.clickTimer);
      this.clickCount = 0;
      this.onMapDoubleClick(event);
    }
  }

  async onMapDoubleClick(event: { lat: number; lng: number }) {
    if (!this.isLocationPickerMode) {
      return;
    }

    console.log('📍 Double-click event received:', event);

    // Set selected location
    this.selectedLocation = {
      lat: event.lat,
      lng: event.lng
    };

    console.log('📍 Selected location:', this.selectedLocation);

    // Show confirmation dialog
    const alert = await this.alertController.create({
      header: 'Set Business Location',
      message: `Do you want to apply this location to your karenderia?<br><br><strong>Coordinates:</strong><br>Latitude: ${this.selectedLocation.lat.toFixed(6)}<br>Longitude: ${this.selectedLocation.lng.toFixed(6)}`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Apply Location',
          role: 'confirm',
          cssClass: 'primary',
          handler: () => {
            this.confirmLocation();
          }
        }
      ]
    });

    await alert.present();
  }

  private showLocationPreview(lat: number, lng: number) {
    this.showToast(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Double-click to select)`);
  }

  confirmLocation() {
    if (this.selectedLocation) {
      console.log('Confirming location:', this.selectedLocation);
      // Navigate back with location data
      this.router.navigate([`/${this.returnTo}`], {
        queryParams: {
          selectedLat: this.selectedLocation.lat,
          selectedLng: this.selectedLocation.lng
        }
      });
    }
  }

  async confirmLocationSelection() {
    if (!this.selectedLocation) {
      this.showToast('Please select a location first');
      return;
    }
    
    this.confirmLocation();
  }

  returnWithLocation() {
    if (!this.selectedLocation || !this.returnTo) {
      console.error('Missing data for return:', { 
        selectedLocation: this.selectedLocation, 
        returnTo: this.returnTo 
      });
      return;
    }
    
    console.log('Returning with location:', this.selectedLocation, 'to:', this.returnTo);
    
    // Navigate back with the selected location data
    this.router.navigate([`/${this.returnTo}`], {
      queryParams: {
        selectedLat: this.selectedLocation.lat,
        selectedLng: this.selectedLocation.lng
      }
    });
  }

  cancelLocationPicking() {
    this.goBack();
  }
}