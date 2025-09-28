import { Component, AfterViewInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { KarenderiaService, Karenderia, SimpleKarenderia } from '../../services/karenderia.service';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() lat = 10.3157; // Default to Cebu City coordinates
  @Input() lng = 123.8854;
  @Input() zoom = 13;
  @Input() isLocationPickerMode = false; // New input for location picker mode
  @Input() searchRadiusMeters = 1000; // Search radius in meters for visual indication
  @Output() mapDoubleClick = new EventEmitter<{lat: number, lng: number}>();

  private map!: L.Map;
  private currentLocationMarker?: L.Marker;
  private karenderiaMarkers: L.Marker[] = [];
  private locationPickerMarker?: L.Marker; // Marker for location picker
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
    // Add a small delay to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initMap();
      this.clearRoute(); // Clear any existing routes
      
      // Only get location and search karenderias if NOT in location picker mode
      if (!this.isLocationPickerMode) {
        this.getCurrentLocation();
        
        // Fallback: if no location is available after 3 seconds, search with default Cebu coordinates
        setTimeout(() => {
          if (!this.currentLocation) {
            console.log('📍 No location detected, using default Cebu coordinates for search');
            this.currentLocation = { lat: 10.3234, lng: 123.9312 };
            this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
            this.searchNearbyKarenderias();
          }
        }, 3000);
      } else {
        console.log('📍 Location picker mode - skipping automatic location detection and karenderia search');
      }
      
      this.setupGlobalFunctions();
      
      // Fallback: if no location is available after 3 seconds, search with default Cebu coordinates
      setTimeout(() => {
        if (!this.currentLocation) {
          console.log('📍 No location detected, using default Cebu coordinates for search');
          this.currentLocation = { lat: 10.3234, lng: 123.9312 };
          this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
          this.searchNearbyKarenderias();
        }
      }, 3000);
    }, 250);
  }

  ngOnDestroy() {
    // Clean up any routes or markers when component is destroyed
    this.clearRoute();
    this.clearKarenderiaMarkers();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }

    this.map = L.map('map', {
      center: [this.lat, this.lng],
      zoom: this.zoom,
      zoomControl: true,
      attributionControl: true,
      doubleClickZoom: !this.isLocationPickerMode, // Disable double-click zoom in location picker mode
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    tiles.addTo(this.map);

    // Add click handler for manual location setting
    this.map.on('click', (e: any) => {
      this.onMapClick(e);
    });

    // Add double-click handler for location picker
    this.map.on('dblclick', (e: any) => {
      this.onMapDoubleClick(e);
    });
  }

  private async onMapClick(e: any): Promise<void> {
    // Only allow manual location setting when NOT in location picker mode
    // Location picker mode uses double-click instead
    if (this.isLocationPickerMode) {
      return;
    }
    
    // For customer maps, don't show location setting dialog
    // Only show for karenderia/owner maps where they need to search around different locations
    return; // Disable click-to-set-location for all maps for now
    
    const alert = await this.alertController.create({
      header: 'Set Location',
      message: 'Set this as your search location?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set Location',
          handler: () => {
            this.currentLocation = {
              lat: e.latlng.lat,
              lng: e.latlng.lng
            };
            this.addCurrentLocationMarker();
            this.updateSearchRadius();
            this.showToast('Location set manually. Searching for karenderias...', 'success');
            this.searchNearbyKarenderias();
          }
        }
      ]
    });

    await alert.present();
  }

  private onMapDoubleClick(e: any): void {
    console.log('📍 Map double-click detected:', e.latlng);
    console.log('📍 Is location picker mode:', this.isLocationPickerMode);
    
    // Only allow double-click location setting in location picker mode
    if (!this.isLocationPickerMode) {
      console.log('📍 Double-click ignored - not in location picker mode');
      return;
    }
    
    // Emit the double-click event with coordinates
    this.mapDoubleClick.emit({
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
    
    console.log('📍 Double-click event emitted with coordinates:', e.latlng.lat, e.latlng.lng);
  }

  private async getCurrentLocation(): Promise<void> {
    // Don't get location or search in location picker mode
    if (this.isLocationPickerMode) {
      console.log('📍 Skipping getCurrentLocation - in location picker mode');
      return;
    }
    
    try {
      console.log('📍 Attempting to get current location...');
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      // First, try to get a quick location fix
      let position;
      try {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000, // 15 second timeout
          maximumAge: 30000 // Accept cached position up to 30 seconds old
        });
      } catch (error) {
        console.warn('High accuracy location failed, trying standard accuracy:', error);
        // Fallback to standard accuracy
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        });
      }

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      console.log('📍 Current location obtained:', this.currentLocation);
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
      this.addCurrentLocationMarker(finalAccuracy);
      this.updateSearchRadius();
      this.searchNearbyKarenderias();
      this.showToast('Location found successfully!', 'success');
      
    } catch (error) {
      console.warn('📍 Error getting location:', error);
      this.showToast('Could not get your location. Using default location.', 'warning');
    }
  }

  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) {
      return;
    }

    // Remove existing marker if any
    if (this.currentLocationMarker) {
      this.map.removeLayer(this.currentLocationMarker);
    }

    // Create custom icon for current location with accuracy indicator
    const accuracyText = accuracy ? `±${Math.round(accuracy)}m` : '';
    const iconHtml = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: #007bff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
        ${accuracyText ? `<div style="background: rgba(0,123,255,0.9); color: white; padding: 2px 4px; border-radius: 3px; font-size: 10px; margin-top: 2px; white-space: nowrap;">${accuracyText}</div>` : ''}
      </div>
    `;

    const currentLocationIcon = L.divIcon({
      html: iconHtml,
      iconSize: [30, 40],
      iconAnchor: [15, 20],
      className: 'current-location-marker'
    });

    this.currentLocationMarker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
      icon: currentLocationIcon,
    }).addTo(this.map);

    // Add accuracy circle if available
    if (accuracy && accuracy > 0) {
      L.circle([this.currentLocation.lat, this.currentLocation.lng], {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.1,
        radius: accuracy,
        weight: 1,
        dashArray: '5, 5'
      }).addTo(this.map);
    }
  }

  private updateSearchRadius(): void {
    // Don't show search radius in location picker mode
    if (this.isLocationPickerMode) {
      return;
    }
    
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
        radius: this.searchRange,
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

  // Search nearby karenderias
  searchNearbyKarenderias(): void {
    // Don't search for karenderias in location picker mode
    if (this.isLocationPickerMode) {
      console.log('📍 Skipping karenderia search - in location picker mode');
      return;
    }
    
    if (!this.currentLocation) {
      // Use default Cebu coordinates if no location
      this.currentLocation = { lat: 10.3234, lng: 123.9312 };
      this.showToast('Using default Cebu location', 'warning');
    }

    this.isSearching = true;
    this.clearKarenderiaMarkers();

    console.log('🗺️ Map component searching for karenderias...');
    console.log('📍 Search params:', {
      lat: this.currentLocation.lat,
      lng: this.currentLocation.lng,
      radius: this.searchRange
    });

    // Use backend API instead of localStorage
    this.karenderiaService.getNearbyKarenderias(
      this.currentLocation.lat,
      this.currentLocation.lng,
      5000 // Use 5km radius to match your test
    ).subscribe({
      next: (karenderias) => {
        console.log('🗺️ Map component received karenderias:', karenderias);
        
        // Convert to SimpleKarenderia format
        this.karenderias = karenderias.map(k => ({
          id: k.id,
          name: k.name,
          address: k.address,
          location: { 
            latitude: k.location?.latitude || k.latitude || 0, 
            longitude: k.location?.longitude || k.longitude || 0 
          },
          description: k.description,
          rating: k.rating || k.average_rating,
          priceRange: k.priceRange,
          cuisine: k.cuisine || [],
          contactNumber: k.contactNumber,
          distance: k.distance,
          imageUrl: k.imageUrl
        }));
        
        this.addKarenderiaMarkers();
        this.isSearching = false;
        this.showToast(`Found ${karenderias.length} karenderias within 5km`, 'success');
      },
      error: (error) => {
        console.error('🗺️ Map search error:', error);
        console.log('🔄 Trying localStorage fallback...');
        
        // Fallback to localStorage if backend fails
        this.karenderiaService.getNearbyKarenderias_Local(
          this.currentLocation!.lat,
          this.currentLocation!.lng,
          this.searchRange
        ).subscribe({
          next: (karenderias) => {
            this.karenderias = karenderias;
            this.addKarenderiaMarkers();
            this.isSearching = false;
            this.showToast(`Found ${karenderias.length} karenderias within ${this.searchRange}m (offline)`, 'warning');
          },
          error: (fallbackError) => {
            console.error('🗺️ Fallback search also failed:', fallbackError);
            this.isSearching = false;
            this.showToast('Search failed. Please try again.', 'danger');
          }
        });
      }
    });
  }

  // Center on location
  async centerOnLocation(): Promise<void> {
    if (this.currentLocation) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
      this.showToast('Centered on your location', 'success');
    } else {
      this.showToast('Getting your location...', 'warning');
      await this.getCurrentLocation();
    }
  }

  // Refresh location with high accuracy
  async refreshLocation(): Promise<void> {
    try {
      this.showToast('Refreshing location with high accuracy...', 'warning');
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0 // Force fresh location
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const accuracy = position.coords.accuracy;
      console.log(`📍 Refreshed location with ${accuracy}m accuracy`);

      // Update location if we got a fresh reading
      this.currentLocation = newLocation;
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
      this.addCurrentLocationMarker(accuracy);
      this.updateSearchRadius();
      
      this.showToast(`Location refreshed with ${Math.round(accuracy)}m accuracy`, 'success');
      
      // Auto-search after refresh
      this.searchNearbyKarenderias();
    } catch (error) {
      console.error('Location refresh failed:', error);
      this.showToast('Could not refresh location. Using current location.', 'danger');
    }
  }

  // Force enable location services
  async enableLocationServices(): Promise<void> {
    try {
      const alert = await this.alertController.create({
        header: 'Enable High Accuracy GPS',
        message: 'For the most accurate karenderia search, please:\n\n1. Enable GPS/Location Services\n2. Allow high accuracy mode\n3. Ensure you\'re outdoors for best signal',
        buttons: [
          {
            text: 'Continue with Current',
            role: 'cancel'
          },
          {
            text: 'Enable GPS',
            handler: async () => {
              await this.getCurrentLocation();
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Error showing location services dialog:', error);
    }
  }

  // Add karenderia markers to map
  private addKarenderiaMarkers(): void {
    // Don't add karenderia markers in location picker mode
    if (this.isLocationPickerMode) {
      console.log('📍 Skipping karenderia markers - in location picker mode');
      return;
    }
    
    this.karenderias.forEach(karenderia => {
      const icon = L.divIcon({
        html: '<div style="background: #28a745; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; font-size: 16px;">🍽️</div>',
        iconSize: [30, 30],
        className: 'karenderia-marker'
      });

      const marker = L.marker([karenderia.location.latitude, karenderia.location.longitude], { icon })
        .addTo(this.map)
        .bindPopup(this.createPopupContent(karenderia), {
          maxWidth: 300,
          className: 'karenderia-popup'
        });

      this.karenderiaMarkers.push(marker);
    });
  }

  // Create popup content for karenderia markers
  private createPopupContent(karenderia: SimpleKarenderia): string {
    const isRoutingActive = this.isRoutingActive;
    const directionsButton = isRoutingActive 
      ? `<button disabled style="background: #ccc; color: #666; border: none; padding: 8px 12px; border-radius: 4px; cursor: not-allowed; font-size: 12px;">
           Route Active
         </button>`
      : `<button onclick="window.getDirections('${karenderia.id}')" 
                style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
           Get Directions
         </button>`;

    return `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${karenderia.name}</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">${karenderia.address}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Distance:</strong> ${Math.round(karenderia.distance || 0)}m</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Rating:</strong> ${karenderia.rating || 'N/A'}</p>
        
        ${isRoutingActive ? '<p style="margin: 5px 0; color: #ff6b35; font-size: 12px; font-style: italic;">Clear current route to get new directions</p>' : ''}
        
        <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
          ${directionsButton}
          <button onclick="window.clearRoute()" 
                  style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Clear Route
          </button>
        </div>
      </div>
    `;
  }

  // Clear all karenderia markers
  private clearKarenderiaMarkers(): void {
    this.karenderiaMarkers.forEach(marker => this.map.removeLayer(marker));
    this.karenderiaMarkers = [];
  }

  // Refresh karenderia markers with updated popup content
  private refreshKarenderiaMarkers(): void {
    this.clearKarenderiaMarkers();
    this.addKarenderiaMarkers();
  }

  // Setup global functions for popup buttons
  private setupGlobalFunctions(): void {
    (window as any).getDirections = (karenderiaId: string) => {
      const karenderia = this.karenderias.find(k => k.id === karenderiaId);
      if (karenderia) {
        this.getDirections(karenderia);
      }
    };

    (window as any).clearRoute = () => {
      this.clearRoute();
    };
  }

  // Get directions to karenderia
  async getDirections(karenderia: SimpleKarenderia): Promise<void> {
    if (!this.currentLocation) {
      this.showToast('Location not available', 'warning');
      return;
    }

    // Check if routing is already active and warn user
    if (this.isRoutingActive) {
      this.showToast('Please clear the current route first', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Getting directions...',
      cssClass: 'loading-accessible',
      backdropDismiss: false,
      keyboardClose: false
    });
    
    try {
      await loading.present();
      
      // Clear any existing routes first (extra safety)
      this.clearRoute();
      
      // Display the new route
      this.displayTurnByTurnRoute(karenderia);
      this.showToast(`Route to ${karenderia.name} displayed. Click "Clear Route" to remove.`, 'success');
      
    } catch (error) {
      console.error('Direction error:', error);
      this.showToast('Error getting directions', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // Display turn-by-turn route using Leaflet Routing Machine
  private displayTurnByTurnRoute(karenderia: SimpleKarenderia): void {
    if (!this.currentLocation) return;

    const startLatLng = L.latLng(this.currentLocation.lat, this.currentLocation.lng);
    const endLatLng = L.latLng(karenderia.location.latitude, karenderia.location.longitude);

    // The 'any' type is used to avoid potential issues with Leaflet plugin typings
    const routingControl = (L.Routing as any).control({
      waypoints: [startLatLng, endLatLng],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
      router: (L.Routing as any).osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        suppressDemoServerWarning: true
      }),
      lineOptions: {
        styles: [{ color: '#007bff', opacity: 0.8, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 100
      },
      createMarker: () => null,
      containerClassName: 'solid-routing-container',
      summaryTemplate: '<h2 role="heading" aria-level="2" style="background: #1f2937 !important; color: white !important; padding: 16px !important; margin: -20px -20px 16px -20px !important; border-radius: 12px 12px 0 0 !important;">{name}</h2><h3 role="heading" aria-level="3" style="background: #d1fae5 !important; color: #065f46 !important; padding: 12px 16px !important; margin: 0 0 16px 0 !important; border-radius: 8px !important; border-left: 4px solid #10b981 !important;">{distance}, {time}</h3>',
      // Apply solid styling directly to the control
      controlOptions: {
        style: {
          'background': '#ffffff !important',
          'background-color': '#ffffff !important',
          'border': '3px solid #1f2937 !important',
          'border-radius': '16px !important',
          'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.5) !important',
          'padding': '20px !important',
          'opacity': '1 !important',
          'backdrop-filter': 'none !important',
          'z-index': '99999 !important'
        }
      }
    }).addTo(this.map);

    // Fix aria-hidden issues and apply solid styling directly to DOM
    setTimeout(() => {
      const routingContainer = document.querySelector('.leaflet-routing-container');
      if (routingContainer) {
        // Apply solid styling directly to the DOM element
        const element = routingContainer as HTMLElement;
        element.style.cssText = `
          background: #ffffff !important;
          background-color: #ffffff !important;
          border: 3px solid #1f2937 !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
          padding: 20px !important;
          opacity: 1 !important;
          backdrop-filter: none !important;
          z-index: 99999 !important;
          max-width: 450px !important;
          max-height: 70vh !important;
          overflow-y: auto !important;
          position: relative !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          color: #111827 !important;
        `;
        
        // Apply styling to all child elements
        const allChildren = element.querySelectorAll('*');
        allChildren.forEach((child) => {
          const childElement = child as HTMLElement;
          childElement.style.opacity = '1';
          childElement.style.background = 'inherit';
          if (childElement.tagName === 'TABLE') {
            childElement.style.cssText += `
              background: #ffffff !important;
              background-color: #ffffff !important;
              border-radius: 8px !important;
              overflow: hidden !important;
            `;
          }
          if (childElement.tagName === 'TR') {
            childElement.style.cssText += `
              background: #ffffff !important;
              background-color: #ffffff !important;
              border-bottom: 1px solid #e5e7eb !important;
            `;
          }
          if (childElement.tagName === 'TD') {
            childElement.style.cssText += `
              padding: 12px 8px !important;
              color: #111827 !important;
              font-weight: 600 !important;
              background: transparent !important;
            `;
          }
        });
        
        routingContainer.removeAttribute('aria-hidden');
        routingContainer.setAttribute('role', 'dialog');
        routingContainer.setAttribute('aria-label', `Directions to ${karenderia.name}`);
        
        // Fix any nested elements that might have focus issues
        const focusableElements = routingContainer.querySelectorAll('button, a, input, [tabindex]');
        focusableElements.forEach((element) => {
          element.removeAttribute('aria-hidden');
        });
        // Add close button functionality
        const existingCloseBtn = routingContainer.querySelector('.leaflet-routing-close');
        if (!existingCloseBtn) {
          // Add custom close button
          routingContainer.classList.add('has-close-button');
          const closeBtn = document.createElement('div');
          closeBtn.innerHTML = '×';
          closeBtn.className = 'custom-routing-close';
          closeBtn.style.cssText = `
            position: absolute !important;
            top: 12px !important;
            right: 12px !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: 2px solid #374151 !important;
            border-radius: 10px !important;
            width: 36px !important;
            height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            color: #374151 !important;
            font-size: 20px !important;
            font-weight: bold !important;
            line-height: 1 !important;
            transition: all 0.2s ease !important;
            z-index: 99999 !important;
            opacity: 1 !important;
          `;
          
          closeBtn.addEventListener('click', () => {
            this.clearRoute();
          });
          
          closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#ef4444 !important';
            closeBtn.style.backgroundColor = '#ef4444 !important';
            closeBtn.style.color = 'white !important';
            closeBtn.style.borderColor = '#dc2626 !important';
            closeBtn.style.transform = 'scale(1.1) !important';
          });
          
          closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#ffffff !important';
            closeBtn.style.backgroundColor = '#ffffff !important';
            closeBtn.style.color = '#374151 !important';
            closeBtn.style.borderColor = '#374151 !important';
            closeBtn.style.transform = 'scale(1) !important';
          });
          
          routingContainer.appendChild(closeBtn);
        } else {
          // Add click listener to existing close button
          existingCloseBtn.addEventListener('click', () => {
            this.clearRoute();
          });
        }
        
        // Create a function to reapply styling if Leaflet overwrites it
        const reapplyStyling = () => {
          const container = document.querySelector('.leaflet-routing-container') as HTMLElement;
          if (container) {
            container.style.cssText = `
              background: #ffffff !important;
              background-color: #ffffff !important;
              border: 3px solid #1f2937 !important;
              border-radius: 16px !important;
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
              padding: 20px !important;
              opacity: 1 !important;
              backdrop-filter: none !important;
              z-index: 99999 !important;
              max-width: 450px !important;
              max-height: 70vh !important;
              overflow-y: auto !important;
              position: relative !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              color: #111827 !important;
            `;
          }
        };
        
        // Reapply styling every 100ms for the first 2 seconds to ensure it sticks
        const styleMaintainer = setInterval(reapplyStyling, 100);
        setTimeout(() => clearInterval(styleMaintainer), 2000);
      }
      
      // Add routing-active class to map container to show routing UI
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.classList.add('routing-active');
      }
    }, 100);

    // Store the routing control to remove it later
    this.currentRoute = routingControl;
    this.isRoutingActive = true;

    // Refresh markers to update popup content
    this.refreshKarenderiaMarkers();

    // Use a layer group for custom markers
    this.routeLayer = L.layerGroup().addTo(this.map);

    // Add custom start marker
    const startIcon = L.divIcon({
      html: `<div style="background: #4caf50; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">A</div>`,
      iconSize: [25, 25],
      className: 'route-marker-a'
    });
    L.marker(startLatLng, { icon: startIcon }).addTo(this.routeLayer).bindPopup('Your Location');

    // Add custom end marker
    const endIcon = L.divIcon({
      html: `<div style="background: #f44336; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">B</div>`,
      iconSize: [25, 25],
      className: 'route-marker-b'
    });
    L.marker(endLatLng, { icon: endIcon }).addTo(this.routeLayer).bindPopup(karenderia.name);

    this.isRoutingActive = true;
  }

  // Clear route
  private clearRoute(): void {
    console.log('🧹 Clearing route...');
    
    // Remove routing control from the map
    if (this.currentRoute) {
      try {
        if (this.map.hasLayer && this.map.hasLayer(this.currentRoute)) {
          this.map.removeControl(this.currentRoute);
        } else {
          // Try alternative removal method
          this.currentRoute.remove();
        }
        console.log('✅ Routing control removed');
      } catch (error) {
        console.error('❌ Error removing routing control:', error);
      }
      this.currentRoute = null;
    }
    
    // Remove custom markers layer
    if (this.routeLayer) {
      try {
        this.map.removeLayer(this.routeLayer);
        console.log('✅ Route layer removed');
      } catch (error) {
        console.error('❌ Error removing route layer:', error);
      }
      this.routeLayer = undefined;
    }

    // Remove routing container from DOM if it exists
    const routingContainers = document.querySelectorAll('.leaflet-routing-container, .leaflet-routing-container-accessible');
    routingContainers.forEach(container => {
      try {
        container.remove();
        console.log('✅ Routing container removed from DOM');
      } catch (error) {
        console.error('❌ Error removing routing container:', error);
      }
    });

    // Remove routing-active class to hide routing UI
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.classList.remove('routing-active');
      console.log('✅ Routing-active class removed');
    }

    // Reset routing state
    this.isRoutingActive = false;
    
    // Refresh markers to update popup content
    this.addKarenderiaMarkers();
    
    // Only show success message if NOT in location picker mode
    if (!this.isLocationPickerMode) {
      this.showToast('Route cleared', 'success');
    }
    console.log('🎉 Route clearing completed');
  }

  // Refresh map size
  public refreshMapSize(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  private async handleLocationError(error: any): Promise<void> {
    console.error('Location error:', error);
    this.currentLocation = { lat: 10.3157, lng: 123.8854 }; // Default location
    this.addCurrentLocationMarker();
    this.updateSearchRadius();
    this.searchNearbyKarenderias();
    this.showToast('Could not get your location. Using Cebu City as default.', 'warning');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}