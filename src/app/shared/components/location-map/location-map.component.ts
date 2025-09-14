import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

@Component({
  selector: 'app-location-map',
  template: `
    <div class="map-container">
      <div class="map-header">
        <h4>
          <ion-icon name="location"></ion-icon>
          Select Your Karenderia Location
        </h4>
        <p>Click on the map to set your business location</p>
      </div>
      <div #mapElement class="map-element" id="map-{{mapId}}"></div>
      <div class="map-info" *ngIf="selectedCoordinates">
        <div class="coordinate-display">
          <div class="coord-item">
            <span class="label">Latitude:</span>
            <span class="value">{{selectedCoordinates.latitude.toFixed(6)}}</span>
          </div>
          <div class="coord-item">
            <span class="label">Longitude:</span>
            <span class="value">{{selectedCoordinates.longitude.toFixed(6)}}</span>
          </div>
        </div>
        <ion-button 
          fill="clear" 
          size="small" 
          (click)="getCurrentLocation()"
          [disabled]="gettingLocation">
          <ion-icon name="locate" slot="start"></ion-icon>
          <span *ngIf="!gettingLocation">Use Current Location</span>
          <span *ngIf="gettingLocation">Getting Location...</span>
        </ion-button>
      </div>
    </div>
  `,
  styleUrls: ['./location-map.component.scss'],
  standalone: false
})
export class LocationMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  @Input() initialCoordinates?: MapCoordinates;
  @Output() coordinatesSelected = new EventEmitter<MapCoordinates>();

  private map!: L.Map;
  private marker?: L.Marker;
  selectedCoordinates?: MapCoordinates;
  gettingLocation = false;
  mapId = Math.random().toString(36).substr(2, 9); // Unique map ID

  // Default center (Philippines)
  private defaultCenter: L.LatLngExpression = [14.5995, 120.9842];

  ngOnInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    // Initialize the map
    this.map = L.map(this.mapElement.nativeElement, {
      center: this.initialCoordinates 
        ? [this.initialCoordinates.latitude, this.initialCoordinates.longitude]
        : this.defaultCenter,
      zoom: this.initialCoordinates ? 16 : 11
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add initial marker if coordinates provided
    if (this.initialCoordinates) {
      this.addMarker(this.initialCoordinates.latitude, this.initialCoordinates.longitude);
      this.selectedCoordinates = this.initialCoordinates;
    }

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addMarker(e.latlng.lat, e.latlng.lng);
      this.selectedCoordinates = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };
      this.coordinatesSelected.emit(this.selectedCoordinates);
    });

    // Get current location if no initial coordinates
    if (!this.initialCoordinates) {
      this.getCurrentLocation();
    }
  }

  private addMarker(lat: number, lng: number): void {
    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Create custom icon
    const customIcon = L.divIcon({
      html: `
        <div class="custom-marker">
          <ion-icon name="restaurant"></ion-icon>
        </div>
      `,
      className: 'custom-marker-container',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    // Add new marker
    this.marker = L.marker([lat, lng], { icon: customIcon })
      .addTo(this.map)
      .bindPopup('Your Karenderia Location')
      .openPopup();
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    this.gettingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        this.map.setView([lat, lng], 16);
        this.addMarker(lat, lng);
        
        this.selectedCoordinates = {
          latitude: lat,
          longitude: lng
        };
        
        this.coordinatesSelected.emit(this.selectedCoordinates);
        this.gettingLocation = false;
      },
      (error) => {
        console.error('Error getting location:', error);
        this.gettingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }
}