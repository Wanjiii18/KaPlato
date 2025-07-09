import { Component, AfterViewInit, Input, OnDestroy } from '@angular/core';
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
    // Add a small delay to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initMap();
      this.getCurrentLocation();
      this.setupGlobalFunctions();
    }, 250);
  }

  ngOnDestroy() {
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
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    tiles.addTo(this.map);
  }

  private async getCurrentLocation(): Promise<void> {
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        await this.requestLocationPermission();
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });

      this.currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 16);
      this.addCurrentLocationMarker();
      this.updateSearchRadius();
    } catch (error) {
      this.handleLocationError(error);
    }
  }

  private async requestLocationPermission(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Location Access Required',
      message: 'Please allow location access.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => this.handleLocationPermissionDenied(),
        },
        {
          text: 'Continue',
          handler: async () => {
            const permissions = await Geolocation.requestPermissions();
            if (permissions.location !== 'granted') {
              this.handleLocationPermissionDenied();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private handleLocationPermissionDenied(): void {
    this.currentLocation = { lat: 14.5995, lng: 120.9842 };
    this.addCurrentLocationMarker();
    this.updateSearchRadius();
  }

  private addCurrentLocationMarker(): void {
    if (!this.currentLocation || !this.map) {
      return;
    }

    // Remove existing marker if any
    if (this.currentLocationMarker) {
      this.map.removeLayer(this.currentLocationMarker);
    }

    // Create custom icon for current location
    const currentLocationIcon = L.divIcon({
      html: '<div style="background-color: #007bff; width: 20px; height: 20px; border-radius: 50%;"></div>',
      iconSize: [20, 20],
    });

    this.currentLocationMarker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
      icon: currentLocationIcon,
    }).addTo(this.map);
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
    if (!this.currentLocation) {
      this.showToast('Location not available', 'warning');
      return;
    }

    this.isSearching = true;
    this.clearKarenderiaMarkers();

    this.karenderiaService.getNearbyKarenderias_Local(
      this.currentLocation.lat,
      this.currentLocation.lng,
      this.searchRange
    ).subscribe({
      next: (karenderias) => {
        this.karenderias = karenderias;
        this.addKarenderiaMarkers();
        this.isSearching = false;
        this.showToast(`Found ${karenderias.length} karenderias within ${this.searchRange}m`, 'success');
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isSearching = false;
        this.showToast('Search failed. Please try again.', 'danger');
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

  // Add karenderia markers to map
  private addKarenderiaMarkers(): void {
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
    return `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${karenderia.name}</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">${karenderia.address}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Distance:</strong> ${Math.round(karenderia.distance || 0)}m</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Rating:</strong> ${karenderia.rating || 'N/A'}</p>
        
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button onclick="window.getDirections('${karenderia.id}')" 
                  style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Get Directions
          </button>
          <button onclick="window.clearRoute()" 
                  style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
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

    const loading = await this.loadingController.create({
      message: 'Getting directions...'
    });
    await loading.present();

    try {
      this.clearRoute();
      this.displayTurnByTurnRoute(karenderia); // Changed from displaySimpleRoute
      this.showToast(`Route to ${karenderia.name} displayed`, 'success');
    } catch (error) {
      console.error('Direction error:', error);
      this.showToast('Error getting directions', 'danger');
    } finally {
      loading.dismiss();
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
      show: false, // Hide the default instructions panel
      lineOptions: {
        styles: [{ color: '#007bff', opacity: 0.8, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 100
      },
      // Disable default markers
      createMarker: () => null
    }).addTo(this.map);

    // Store the routing control to remove it later
    this.currentRoute = routingControl;

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
    // Remove routing control from the map
    if (this.currentRoute && this.map.hasLayer(this.currentRoute)) {
      this.map.removeControl(this.currentRoute);
    }
    
    // Remove custom markers layer
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }

    this.isRoutingActive = false;
    this.currentRoute = null;
  }

  // Refresh map size
  public refreshMapSize(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  private handleLocationError(error: any): void {
    console.error('Location error:', error);
    this.currentLocation = { lat: 14.5995, lng: 120.9842 }; // Default location
    this.addCurrentLocationMarker();
    this.updateSearchRadius();
    this.showToast('Using default location due to error.', 'warning');
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
