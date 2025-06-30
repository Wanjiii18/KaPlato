import { Component, AfterViewInit, Input, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { KarenderiaService, Karenderia } from '../../services/karenderia.service';
import { LoadingController, ToastController } from '@ionic/angular';

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
  
  // Search parameters
  currentLocation: { lat: number, lng: number } | null = null;
  searchRange = 1000; // Default 1km in meters
  isSearching = false;
  karenderias: (Karenderia & { distance?: number })[] = [];

  constructor(
    private karenderiaService: KarenderiaService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngAfterViewInit() {
    this.initMap();
    this.getCurrentLocation();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [this.lat, this.lng],
      zoom: this.zoom
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  private getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Update map view to current location
          this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 15);
          
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
    if (this.currentLocation) {
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

      this.currentLocationMarker.bindPopup('Your current location').openPopup();
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

    // Use real service to get nearby karenderias
    this.karenderiaService.getNearbyKarenderias(
      this.currentLocation.lat, 
      this.currentLocation.lng, 
      this.searchRange
    ).subscribe({
      next: (karenderias) => {
        this.karenderias = karenderias;
        this.addKarenderiaMarkers();
        this.isSearching = false;
        
        if (karenderias.length === 0) {
          this.showToast(`No karenderias found within ${this.searchRange}m`, 'primary');
        } else {
          this.showToast(`Found ${karenderias.length} karenderias nearby`, 'success');
        }
      },
      error: (error) => {
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
        html: `<div style="background-color: #28a745; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">K</div>`,
        iconSize: [30, 30],
        className: 'karenderia-marker'
      });

      const marker = L.marker([karenderia.location.latitude, karenderia.location.longitude], {
        icon: karenderiaIcon
      }).addTo(this.map);

      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #333;">${karenderia.name}</h3>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">${karenderia.address}</p>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">📍 ${Math.round(karenderia.distance || 0)}m away</p>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">⭐ ${karenderia.rating || 'N/A'} | ${karenderia.priceRange}</p>
          ${karenderia.description ? `<p style="margin: 4px 0; color: #666; font-size: 12px; font-style: italic;">${karenderia.description}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      this.karenderiaMarkers.push(marker);
    });
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
}
