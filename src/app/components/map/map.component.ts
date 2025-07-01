import { Component, AfterViewInit, Input, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { KarenderiaService, Karenderia, SimpleKarenderia } from '../../services/karenderia.service';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() lat = 14.5995; // Default to Manila coordinates
  @Input() lng = 120.9842;
  @Input() zoom = 13;

  private map!: L.Map;
  private currentLocationMarker?: L.Marker;
  private karenderiaMarkers: L.Marker[] = [];
  private searchRadius: L.Circle | undefined;
  private routeLayer?: L.LayerGroup;
  
  // Search parameters
  currentLocation: { lat: number, lng: number } | null = null;
  searchRange = 1000; // Default 1km in meters
  isSearching = false;
  karenderias: SimpleKarenderia[] = [];
  
  // Route parameters
  isRoutingActive = false;
  currentRoute: any = null;

  constructor(
    private karenderiaService: KarenderiaService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngAfterViewInit() {
    this.initMap();
    this.getCurrentLocation();
    this.setupGlobalFunctions();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    try {
      console.log('🗺️ Initializing map...');
      
      // Make sure the map container exists
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('❌ Map container not found!');
        return;
      }
      
      this.map = L.map('map', {
        center: [this.lat, this.lng],
        zoom: this.zoom,
        zoomControl: true,
        attributionControl: true
      });

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });

      tiles.addTo(this.map);
      
      console.log('✅ Map initialized successfully');
      
      // Wait a bit for map to be fully ready
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('🔄 Map size invalidated (refreshed)');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }

  private getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          console.log('📍 Got location:', this.currentLocation);
          
          // Wait for map to be fully initialized before setting view
          setTimeout(() => {
            if (this.map && this.currentLocation) {
              try {
                this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 15);
                console.log('✅ Map view updated to current location');
              } catch (error) {
                console.error('❌ Error setting map view:', error);
              }
            }
          }, 500);
          
          // Add current location marker
          this.addCurrentLocationMarker();
          
          // Show search radius
          this.updateSearchRadius();
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to default location (Manila)
          this.currentLocation = { lat: this.lat, lng: this.lng };
          this.addCurrentLocationMarker();
          this.updateSearchRadius();
        }
      );
    } else {
      console.warn('Geolocation not supported');
      this.currentLocation = { lat: this.lat, lng: this.lng };
      this.addCurrentLocationMarker();
      this.updateSearchRadius();
    }
  }

  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) {
      console.log('⏳ Waiting for location or map to be ready...');
      return;
    }

    try {
      // Remove existing marker if any
      if (this.currentLocationMarker) {
        this.map.removeLayer(this.currentLocationMarker);
      }

      // Create custom icon for current location
      const currentLocationIcon = L.divIcon({
        html: '<div style="background-color: #007bff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        className: 'current-location-marker'
      });

      this.currentLocationMarker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
        icon: currentLocationIcon
      }).addTo(this.map);

      this.currentLocationMarker.bindPopup('Your current location');
      
      console.log('✅ Current location marker added');
    } catch (error) {
      console.error('❌ Error adding current location marker:', error);
    }
  }

  private updateSearchRadius(): void {
    if (this.currentLocation) {
      // Remove existing radius circle
      if (this.searchRadius) {
        this.map.removeLayer(this.searchRadius);
      }

      // Add new radius circle
      this.searchRadius = L.circle([this.currentLocation.lat, this.currentLocation.lng], {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.1,
        radius: this.searchRange
      }).addTo(this.map);
    }
  }

  onRangeChange(event: any): void {
    this.searchRange = parseInt(event.detail.value);
    this.updateSearchRadius();
    
    // Automatically search when range changes
    if (this.currentLocation) {
      this.searchNearbyKarenderias();
    }
  }

  searchNearbyKarenderias(): void {
    if (!this.currentLocation) {
      this.showToast('Current location not available', 'warning');
      return;
    }

    this.isSearching = true;
    
    // Clear existing karenderia markers
    this.clearKarenderiaMarkers();

    // Use localStorage service to get nearby karenderias
    this.karenderiaService.getNearbyKarenderias_Local(
      this.currentLocation.lat, 
      this.currentLocation.lng, 
      this.searchRange
    ).subscribe({
      next: (karenderias: SimpleKarenderia[]) => {
        this.karenderias = karenderias;
        this.addKarenderiaMarkers();
        this.isSearching = false;
        
        if (karenderias.length === 0) {
          this.showToast(`No karenderias found within ${this.searchRange}m`, 'primary');
        } else {
          this.showToast(`Found ${karenderias.length} karenderias nearby`, 'success');
        }
      },
      error: (error: any) => {
        console.error('Error searching karenderias:', error);
        this.isSearching = false;
        this.showToast('Error searching for karenderias. Please try again.', 'danger');
        
        // Fallback to mock data if there's an error
        this.generateAndDisplayMockData();
      }
    });
  }

  private addKarenderiaMarkers(): void {
    this.karenderias.forEach(karenderia => {
      const karenderiaIcon = L.divIcon({
        html: `<div style="background-color: #28a745; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🍽️</div>`,
        iconSize: [30, 30],
        className: 'karenderia-marker'
      });

      const marker = L.marker([karenderia.location.latitude, karenderia.location.longitude], {
        icon: karenderiaIcon
      }).addTo(this.map);

      const popupContent = this.createPopupContent(karenderia);
      
      marker.bindPopup(popupContent, {
        maxWidth: 380,
        maxHeight: 500,
        className: 'karenderia-popup',
        autoPan: true,
        keepInView: true,
        autoClose: false,
        closeOnClick: false
      });
      
      this.karenderiaMarkers.push(marker);
    });
  }

  private createPopupContent(karenderia: SimpleKarenderia): string {
    const menuSection = karenderia.menu && karenderia.menu.length > 0 
      ? this.createMenuSection(karenderia.menu) 
      : '<p style="color: #999; font-style: italic;">No menu available</p>';

    return `
      <div style="width: 100%; max-width: 380px;">
        <div style="border-bottom: 2px solid #28a745; padding-bottom: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #333; font-size: 16px;">${karenderia.name}</h3>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">📍 ${karenderia.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span style="color: #666; font-size: 12px;">📍 ${Math.round(karenderia.distance || 0)}m away</span>
            <span style="color: #666; font-size: 12px;">⭐ ${karenderia.rating || 'N/A'} | ${karenderia.priceRange}</span>
          </div>
        </div>
        
        ${karenderia.description ? `<p style="margin: 6px 0; color: #666; font-size: 12px; font-style: italic;">${karenderia.description}</p>` : ''}
        
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h4 style="margin: 0; color: #28a745; font-size: 14px; font-weight: 600;">🍽️ Menu</h4>
            <small style="color: #999; font-size: 9px; background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">Scroll ↕️</small>
          </div>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 11px; font-style: italic;">Click on any dish to see ingredients and allergens</p>
          
          <!-- Scrollable Menu Container with better scrolling -->
          <div style="
            max-height: 180px; 
            overflow-y: scroll; 
            overflow-x: hidden;
            padding: 8px; 
            border: 2px solid #e9ecef; 
            border-radius: 8px; 
            background: #fafafa;
            scrollbar-width: thin;
            scrollbar-color: #28a745 #f1f1f1;
            -webkit-overflow-scrolling: touch;
          ">
            ${menuSection}
            <!-- Bottom spacer to ensure last item is visible -->
            <div style="height: 8px;"></div>
          </div>
          
          <!-- Clear scroll indicator -->
          <div style="text-align: center; margin-top: 6px;">
            <small style="color: #28a745; font-size: 9px; font-weight: 600;">↕️ Scroll inside menu box to see all dishes</small>
          </div>
        </div>
        
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; display: flex; gap: 8px;">
          <button onclick="window.getDirections(${karenderia.location.latitude}, ${karenderia.location.longitude}, '${karenderia.name.replace(/'/g, "\\'")}', event)" 
                  style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;">
            🗺️ Get Directions
          </button>
          <button onclick="window.clearRoute()" 
                  style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Clear Route
          </button>
        </div>
      </div>
    `;
  }

  private createMenuSection(menu: any[]): string {
    return menu.map((item, index) => `
      <div class="menu-item" onclick="window.showMenuDetails('${JSON.stringify(item).replace(/'/g, "\\'")}', event)" 
           style="
             background: #ffffff; 
             margin: 3px 0; 
             padding: 6px 8px; 
             border-radius: 6px; 
             cursor: pointer; 
             border-left: 3px solid #28a745; 
             transition: all 0.2s ease; 
             position: relative;
             box-shadow: 0 1px 3px rgba(0,0,0,0.1);
             border: 1px solid #e9ecef;
           " 
           onmouseover="this.style.background='#f1f3f4'; this.style.transform='translateX(2px)'"
           onmouseout="this.style.background='#ffffff'; this.style.transform='translateX(0)'">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1; margin-right: 8px;">
            <span style="font-weight: 600; color: #333; font-size: 12px; display: block;">${item.name}</span>
            <p style="margin: 1px 0 3px 0; color: #666; font-size: 10px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.description}</p>
          </div>
          <span style="color: #28a745; font-weight: bold; font-size: 12px; white-space: nowrap;">₱${item.price}</span>
        </div>
        ${item.allergens && item.allergens.length > 0 
          ? `<div style="margin-top: 3px;">
               <span style="background: #fff3cd; color: #856404; padding: 1px 4px; border-radius: 8px; font-size: 9px; font-weight: 500;">
                 ⚠️ ${item.allergens.join(', ')}
               </span>
             </div>`
          : `<div style="margin-top: 3px;">
               <span style="background: #d4edda; color: #155724; padding: 1px 4px; border-radius: 8px; font-size: 9px; font-weight: 500;">
                 ✅ Safe
               </span>
             </div>`
        }
      </div>
    `).join('');
  }

  private clearKarenderiaMarkers(): void {
    this.karenderiaMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.karenderiaMarkers = [];
  }

  centerOnLocation(): void {
    if (this.currentLocation) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 15);
    }
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  private generateAndDisplayMockData(): void {
    console.log('Falling back to mock data');
    if (this.currentLocation) {
      this.karenderias = this.generateMockKarenderias();
      this.addKarenderiaMarkers();
    }
  }

  private generateMockKarenderias(): (Karenderia & { distance?: number })[] {
    if (!this.currentLocation) return [];

    const mockData: (Karenderia & { distance?: number })[] = [];
    const names = [
      'Lola Rosa\'s Karenderia',
      'Tita Neng\'s Eatery', 
      'Kuya Jun\'s Food House',
      'Ate Marie\'s Kitchen',
      'Bahay Kubo Restaurant',
      'Sari-Sari Karenderia'
    ];

    for (let i = 0; i < 6; i++) {
      // Generate random locations within the search radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * this.searchRange;
      
      const offsetLat = (distance * Math.cos(angle)) / 111320; // Convert meters to degrees
      const offsetLng = (distance * Math.sin(angle)) / (111320 * Math.cos(this.currentLocation.lat * Math.PI / 180));

      const location = {
        latitude: this.currentLocation.lat + offsetLat,
        longitude: this.currentLocation.lng + offsetLng
      };

      mockData.push({
        id: `mock-${i + 1}`,
        name: names[i],
        location: { latitude: location.latitude, longitude: location.longitude } as any,
        address: `Sample Address ${i + 1}, Manila`,
        distance: Math.round(distance),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
        priceRange: Math.random() > 0.5 ? 'Moderate' : 'Budget' as 'Budget' | 'Moderate' | 'Expensive',
        description: `Traditional Filipino food served with love`,
        cuisine: ['Filipino', 'Traditional']
      });
    }

    return mockData;
  }

  // Method to easily test the search functionality with real data
  async testSearchWithRealData(): Promise<void> {
    console.log('🧪 Testing search with real Karenderia data...');
    
    if (!this.currentLocation) {
      console.log('⚠️ Getting current location first...');
      this.getCurrentLocation();
      
      // Wait a bit for location to be set
      setTimeout(() => {
        if (this.currentLocation) {
          this.performTestSearch();
        } else {
          console.log('❌ Could not get current location, using default Mandaue coordinates');
          this.currentLocation = { lat: 10.3231, lng: 123.9319 };
          this.addCurrentLocationMarker();
          this.updateSearchRadius();
          this.performTestSearch();
        }
      }, 1000);
    } else {
      this.performTestSearch();
    }
  }

  private performTestSearch(): void {
    console.log('🔍 Performing test search...');
    console.log(`📍 Current location: ${this.currentLocation?.lat}, ${this.currentLocation?.lng}`);
    console.log(`📏 Search range: ${this.searchRange}m`);
    
    this.searchNearbyKarenderias();
  }

  private setupGlobalFunctions(): void {
    console.log('🔧 Setting up global functions...');
    
    // Setup global function for menu item interactions
    (window as any).showMenuDetails = (itemJson: string, event: Event) => {
      console.log('🍽️ showMenuDetails called');
      event.stopPropagation();
      try {
        const item = JSON.parse(itemJson);
        this.showMenuItemDetails(item);
      } catch (error) {
        console.error('Error parsing menu item:', error);
      }
    };

    // Setup global function for routing
    (window as any).getDirections = (lat: number, lng: number, name: string, event: Event) => {
      console.log('🗺️ getDirections global function called');
      console.log('� Destination coordinates:', lat, lng);
      console.log('🏪 Karenderia name:', name);
      event.stopPropagation();
      
      // Create a simple karenderia object with the required structure
      const karenderia: SimpleKarenderia = {
        name: name,
        address: 'Unknown Address', // Placeholder since we only have coordinates
        location: {
          latitude: lat,
          longitude: lng
        },
        priceRange: 'Moderate' // Default value
      };
      
      console.log('� Created karenderia object:', karenderia);
      console.log('🌍 Current user location:', this.currentLocation);
      this.getDirections(karenderia);
    };

    // Setup global function for clearing routes
    (window as any).clearRoute = () => {
      console.log('🧹 clearRoute global function called');
      this.clearRoute();
      this.showToast('Route cleared', 'secondary');
    };

    console.log('✅ Global functions setup complete');
  }

  private async showMenuItemDetails(item: any): Promise<void> {
    const alert = await this.alertController.create({
      header: `🍽️ ${item.name}`,
      subHeader: `₱${item.price} • ${item.category}`,
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #666; font-style: italic; font-size: 14px;">${item.description}</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #e8f5e8, #f1f8f1); padding: 15px; border-radius: 10px; margin: 12px 0; border-left: 5px solid #28a745;">
            <h4 style="margin: 0 0 10px 0; color: #2d5016; font-size: 16px;">🥘 Ingredients Used:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${item.ingredients.map((ing: string) => `
                <span style="
                  background: linear-gradient(45deg, #28a745, #20c997); 
                  color: white; 
                  padding: 6px 12px; 
                  border-radius: 20px; 
                  font-size: 12px; 
                  font-weight: 500;
                  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
                  display: inline-block;
                ">
                  ${ing}
                </span>
              `).join('')}
            </div>
          </div>
          
          ${item.allergens && item.allergens.length > 0 
            ? `<div style="background: linear-gradient(135deg, #fff8e1, #fff3cd); border: 2px solid #ffc107; padding: 15px; border-radius: 10px; margin: 12px 0;">
                 <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 16px;">⚠️ Allergy Warning</h4>
                 <p style="margin: 0; color: #856404; font-weight: 500;">
                   This dish contains: <strong style="color: #dc3545;">${item.allergens.join(', ')}</strong>
                 </p>
                 <p style="margin: 8px 0 0 0; color: #856404; font-size: 12px; font-style: italic;">
                   Please inform us if you have any food allergies
                 </p>
               </div>`
            : `<div style="background: linear-gradient(135deg, #d4edda, #c3e6cb); border: 2px solid #28a745; padding: 15px; border-radius: 10px; margin: 12px 0;">
                 <h4 style="margin: 0 0 8px 0; color: #155724; font-size: 16px;">✅ Allergy-Friendly</h4>
                 <p style="margin: 0; color: #155724; font-weight: 500;">No known allergens in this dish</p>
               </div>`
          }
          
          <div style="text-align: center; margin-top: 15px; padding: 10px; background: ${item.isAvailable ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
            <strong style="color: ${item.isAvailable ? '#155724' : '#721c24'}; font-size: 14px;">
              ${item.isAvailable ? '✅ Available Now - Ready to Cook!' : '❌ Currently Unavailable'}
            </strong>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'secondary'
        }
      ]
    });

    await alert.present();
  }

  private async addToFavorites(item: any): Promise<void> {
    // Here you could integrate with your user profile service to save favorites
    const toast = await this.toastController.create({
      message: `${item.name} added to favorites! 💕`,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  // Routing functionality
  async getDirections(karenderia: SimpleKarenderia): Promise<void> {
    console.log('🚀 getDirections called for:', karenderia.name);
    
    if (!this.currentLocation) {
      console.error('❌ No current location available');
      this.showToast('Location not available. Please enable location services.', 'warning');
      return;
    }

    if (!this.map) {
      console.error('❌ Map not initialized');
      this.showToast('Map not ready. Please wait and try again.', 'warning');
      return;
    }

    console.log('📍 Current location:', this.currentLocation);
    console.log('🎯 Destination:', karenderia.location);

    const loading = await this.loadingController.create({
      message: 'Finding the best route using OpenStreetMap...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Clear existing route
      this.clearRoute();
      console.log('🧹 Cleared existing routes');

      // Try to get accurate road-based route first
      console.log('🛣️ Attempting to get accurate road-based route...');
      const routeData = await this.fetchRoute(
        this.currentLocation.lat,
        this.currentLocation.lng,
        karenderia.location.latitude,
        karenderia.location.longitude
      );

      if (routeData && routeData.features && routeData.features.length > 0) {
        console.log('✅ Got accurate road route data, displaying real road route');
        this.displayRoute(routeData, karenderia);
        
        // Calculate route info
        const route = routeData.features[0];
        const distance = route.properties?.segments?.[0]?.distance;
        const duration = route.properties?.segments?.[0]?.duration;
        
        let routeInfo = `Accurate route to ${karenderia.name} displayed!`;
        if (distance && duration) {
          const distanceKm = (distance / 1000).toFixed(1);
          const durationMin = Math.ceil(duration / 60);
          routeInfo += ` (${distanceKm}km, ~${durationMin} min)`;
        }
        
        this.showToast(routeInfo, 'success');
      } else {
        console.log('⚠️ Road-based routing failed, falling back to straight line route');
        await this.displaySimpleRoute(karenderia);
        this.showToast(`Route to ${karenderia.name} displayed (straight line - road routing unavailable)!`, 'warning');
      }

    } catch (error) {
      console.error('❌ Error getting directions:', error);
      console.log('🔄 Falling back to simple route due to error');
      try {
        await this.displaySimpleRoute(karenderia);
        this.showToast(`Route to ${karenderia.name} displayed (fallback route)!`, 'warning');
      } catch (fallbackError) {
        console.error('❌ Even simple route failed:', fallbackError);
        this.showToast('Error creating route. Please try again.', 'danger');
      }
    } finally {
      loading.dismiss();
    }
  }

  private async fetchRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    console.log('🗺️ Fetching accurate road-based route from:', startLat, startLng, 'to:', endLat, endLng);
    
    // Try multiple routing services for better reliability and road accuracy
    const routingServices = [
      {
        name: 'OpenRouteService',
        fetcher: () => this.fetchOpenRouteServiceRoute(startLat, startLng, endLat, endLng)
      },
      {
        name: 'OSRM',
        fetcher: () => this.fetchOSRMRoute(startLat, startLng, endLat, endLng)
      },
      {
        name: 'MapBox',
        fetcher: () => this.fetchMapBoxRoute(startLat, startLng, endLat, endLng)
      }
    ];

    for (const service of routingServices) {
      try {
        console.log(`🔄 Trying ${service.name} for accurate routing...`);
        const routeData = await service.fetcher();
        
        if (routeData && this.validateRouteData(routeData)) {
          console.log(`✅ Successfully got accurate route from ${service.name}`);
          return routeData;
        }
        
        console.log(`⚠️ ${service.name} returned invalid or empty route data`);
      } catch (error) {
        console.error(`❌ ${service.name} failed:`, error);
        continue;
      }
    }

    console.error('❌ All routing services failed');
    return null;
  }

  private async fetchOpenRouteServiceRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    // Using OpenRouteService API for accurate road-based routing
    const apiKey = '5b3ce3597851110001cf62489c3e4b27b5174be5bee72b23d89bccfc';
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}&geometry_simplify=false&instructions=true&format=geojson`;
    
    console.log('🌐 OpenRouteService URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouteService HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 OpenRouteService response (accurate routing):', data);
    return data;
  }

  private async fetchOSRMRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    // Using public OSRM demo server for accurate road routing
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&annotations=true`;
    
    console.log('🌐 OSRM URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 OSRM response (accurate routing):', data);
    
    // Convert OSRM format to GeoJSON format for consistency
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        features: [{
          type: 'Feature',
          geometry: route.geometry,
          properties: {
            segments: [{
              distance: route.distance,
              duration: route.duration,
              steps: route.legs?.[0]?.steps || []
            }]
          }
        }],
        bbox: data.routes[0].geometry.coordinates.reduce((bbox: number[], coord: number[]) => {
          return [
            Math.min(bbox[0], coord[0]),
            Math.min(bbox[1], coord[1]),
            Math.max(bbox[2], coord[0]),
            Math.max(bbox[3], coord[1])
          ];
        }, [180, 90, -180, -90])
      };
    }
    
    return null;
  }

  private async fetchMapBoxRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    // Using MapBox Directions API (free tier available)
    // Note: You'll need to get a free API key from mapbox.com
    const accessToken = 'pk.eyJ1IjoidGVzdC11c2VyIiwiYSI6ImNsZGZhYzFmZDAwMGgzb3Bvcm03MXdndHQifQ.abc123'; // Replace with actual token
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&steps=true&access_token=${accessToken}`;
    
    console.log('🌐 MapBox URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MapBox HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 MapBox response (accurate routing):', data);
    
    // Convert MapBox format to GeoJSON format
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        features: [{
          type: 'Feature',
          geometry: route.geometry,
          properties: {
            segments: [{
              distance: route.distance,
              duration: route.duration,
              steps: route.legs?.[0]?.steps || []
            }]
          }
        }]
      };
    }
    
    return null;
  }

  private validateRouteData(routeData: any): boolean {
    const isValid = routeData && 
           routeData.features && 
           routeData.features.length > 0 && 
           routeData.features[0].geometry && 
           routeData.features[0].geometry.coordinates &&
           routeData.features[0].geometry.coordinates.length > 1;
    
    console.log('🔍 Route data validation:', isValid ? 'VALID' : 'INVALID', routeData);
    return isValid;
  }

  private displayRoute(routeData: any, karenderia: SimpleKarenderia): void {
    console.log('🗺️ Displaying accurate road-based route');
    
    if (!routeData.features || routeData.features.length === 0) {
      console.log('⚠️ No route features, falling back to simple route');
      this.displaySimpleRoute(karenderia);
      return;
    }

    const route = routeData.features[0];
    const coordinates = route.geometry.coordinates;
    
    // Convert coordinates to Leaflet format [lat, lng]
    const latLngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    console.log('📍 Route has', latLngs.length, 'coordinate points (more points = more accurate)');

    // Create route layer group
    this.routeLayer = L.layerGroup().addTo(this.map);

    // Add route polyline with enhanced styling for accuracy indication
    const routeLine = L.polyline(latLngs, {
      color: '#1976d2',        // Blue to indicate accurate routing
      weight: 7,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '0'           // Solid line for accurate routes
    }).addTo(this.routeLayer);

    // Add route border for better visibility
    const routeBorder = L.polyline(latLngs, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.routeLayer);

    // Move the main route line to front
    routeLine.bringToFront();

    // Add start marker with "GPS" indicator
    const startIcon = L.divIcon({
      html: '<div style="background: #4caf50; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 14px;">📍</div>',
      iconSize: [28, 28],
      className: 'route-start-marker'
    });

    L.marker([this.currentLocation!.lat, this.currentLocation!.lng], {
      icon: startIcon
    }).addTo(this.routeLayer).bindTooltip('Your Location', {
      permanent: false,
      direction: 'top'
    });

    // Add end marker with restaurant icon
    const endIcon = L.divIcon({
      html: '<div style="background: #f44336; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 14px;">🍽️</div>',
      iconSize: [28, 28],
      className: 'route-end-marker'
    });

    L.marker([karenderia.location.latitude, karenderia.location.longitude], {
      icon: endIcon
    }).addTo(this.routeLayer).bindTooltip(karenderia.name, {
      permanent: false,
      direction: 'top'
    });

    // Extract and display route information
    const segment = route.properties?.segments?.[0];
    if (segment) {
      const distance = segment.distance;
      const duration = segment.duration;
      
      console.log('📊 Route info - Distance:', distance, 'meters, Duration:', duration, 'seconds');
      
      // Show route info popup with accuracy indication
      this.showRouteInfo(karenderia, distance, duration, true);
    }

    // Fit map to show entire route with padding
    this.map.fitBounds(routeLine.getBounds(), { 
      padding: [40, 40],
      maxZoom: 16  // Don't zoom in too much for better route overview
    });

    console.log('✅ Accurate road-based route displayed successfully');
  }

  private async displaySimpleRoute(karenderia: SimpleKarenderia): Promise<void> {
    console.log('🛣️ displaySimpleRoute called - showing straight-line fallback route (not following roads)');
    
    if (!this.currentLocation) {
      console.error('❌ No current location for route display');
      return;
    }

    if (!this.map) {
      console.error('❌ Map not ready for route display');
      return;
    }

    console.log('📍 Route from:', this.currentLocation);
    console.log('🎯 Route to:', karenderia.location);

    try {
      // Clear any existing route first
      this.clearRoute();

      // Create route layer group and add to map
      this.routeLayer = L.layerGroup();
      this.map.addLayer(this.routeLayer);
      console.log('🗂️ Route layer created and added to map');

      // Create coordinates array
      const startCoords: [number, number] = [this.currentLocation.lat, this.currentLocation.lng];
      const endCoords: [number, number] = [karenderia.location.latitude, karenderia.location.longitude];
      
      console.log('📍 Start coordinates:', startCoords);
      console.log('🎯 End coordinates:', endCoords);

      // Validate coordinates
      if (isNaN(startCoords[0]) || isNaN(startCoords[1]) || isNaN(endCoords[0]) || isNaN(endCoords[1])) {
        throw new Error('Invalid coordinates');
      }

      // Create the route line with fallback styling to indicate it's not accurate
      const routeLine = L.polyline([startCoords, endCoords], {
        color: '#FF9800',  // Orange to indicate this is not an accurate road route
        weight: 6,
        opacity: 0.8,
        dashArray: '10, 5',  // Dashed to show it's not following real roads
        lineCap: 'round'
      });

      // Add route line to the route layer
      this.routeLayer.addLayer(routeLine);
      console.log('📊 Route line created and added to layer');

      // Add start marker (green A)
      const startIcon = L.divIcon({
        html: '<div style="background: #34a853; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 14px; z-index: 1000;">A</div>',
        iconSize: [30, 30],
        className: 'route-start-marker'
      });

      const startMarker = L.marker(startCoords, { icon: startIcon });
      this.routeLayer.addLayer(startMarker);
      console.log('🅰️ Start marker added');

      // Add end marker (red B)
      const endIcon = L.divIcon({
        html: '<div style="background: #ea4335; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 14px; z-index: 1000;">B</div>',
        iconSize: [30, 30],
        className: 'route-end-marker'
      });

      const endMarker = L.marker(endCoords, { icon: endIcon });
      this.routeLayer.addLayer(endMarker);
      console.log('🅱️ End marker added');

      // Calculate distance
      const distance = this.calculateDistance(
        this.currentLocation.lat, 
        this.currentLocation.lng,
        karenderia.location.latitude,
        karenderia.location.longitude
      );

      console.log('📏 Calculated distance:', distance, 'meters');

      // Force map to show the route
      const bounds = routeLine.getBounds();
      console.log('🗺️ Route bounds:', bounds);
      
      // Wait a bit then fit bounds
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 16
      });
      console.log('🔍 Map view updated to show route');

      // Show route info with accuracy warning (false = not accurate)
      this.showRouteInfo(karenderia, distance, Math.round(distance / 50 * 60), false);

      // Set routing as active
      this.isRoutingActive = true;

      console.log('✅ Simple route displayed successfully');
      console.log('🎯 Route layer has', this.routeLayer.getLayers().length, 'layers');
      
    } catch (error) {
      console.error('❌ Error displaying simple route:', error);
      throw error;
    }
  }

  private async showRouteInfo(karenderia: SimpleKarenderia, distance: number, duration: number, isAccurate: boolean = false): Promise<void> {
    const distanceKm = (distance / 1000).toFixed(1);
    const durationMin = Math.round(duration / 60);
    
    const accuracyBadge = isAccurate 
      ? '<span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">📍 ACCURATE ROUTE</span>'
      : '<span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">⚠️ STRAIGHT LINE</span>';
    
    const routeDescription = isAccurate 
      ? 'This route follows real roads using OpenStreetMap data, similar to Google Maps.'
      : 'This is a straight-line estimate. Actual travel distance and time may vary.';
    
    const alert = await this.alertController.create({
      header: '🗺️ Route Information',
      message: `
        <div style="text-align: left;">
          <div style="margin-bottom: 10px;">${accuracyBadge}</div>
          <p><strong>Destination:</strong> ${karenderia.name}</p>
          <p><strong>Distance:</strong> ${distanceKm} km</p>
          <p><strong>Estimated Time:</strong> ${durationMin} minutes</p>
          <p><strong>Address:</strong> ${karenderia.address}</p>
          <hr style="margin: 10px 0;">
          <p style="font-size: 12px; color: #666;"><em>${routeDescription}</em></p>
        </div>
      `,
      buttons: [
        {
          text: 'Clear Route',
          handler: () => {
            this.clearRoute();
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private clearRoute(): void {
    console.log('🧹 clearRoute called');
    
    if (this.routeLayer) {
      console.log('🗑️ Removing existing route layer with', this.routeLayer.getLayers().length, 'layers');
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
      console.log('✅ Route layer removed');
    } else {
      console.log('ℹ️ No route layer to clear');
    }
    
    this.isRoutingActive = false;
    this.currentRoute = null;
    console.log('🏁 Route state reset');
  }

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



}
