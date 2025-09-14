import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { KarenderiaService } from '../../services/karenderia.service';

declare var google: any;

@Component({
  selector: 'app-karenderia-location-update',
  templateUrl: './karenderia-location-update.page.html',
  styleUrls: ['./karenderia-location-update.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class KarenderiaLocationUpdatePage implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  karenderia: any = null;
  map: any;
  marker: any;
  selectedLocation = { lat: 10.3157, lng: 123.8854 }; // Default to Cebu City
  searchAddress = '';
  isLoading = false;
  isSaving = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private karenderiaService: KarenderiaService
  ) {}

  async ngOnInit() {
    await this.loadKarenderiaData();
  }

  async ngAfterViewInit() {
    setTimeout(() => {
      this.loadGoogleMaps();
    }, 500);
  }

  async loadKarenderiaData() {
    this.isLoading = true;
    try {
      this.karenderiaService.getCurrentUserKarenderia().subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.karenderia = response.data;
            this.searchAddress = this.karenderia.address;
            
            // If karenderia has coordinates, use them
            if (this.karenderia.latitude && this.karenderia.longitude) {
              this.selectedLocation = {
                lat: parseFloat(this.karenderia.latitude),
                lng: parseFloat(this.karenderia.longitude)
              };
            }
          }
        },
        error: (error) => {
          console.error('Error loading karenderia:', error);
          this.showToast('Error loading karenderia data', 'danger');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
      this.showToast('Error loading data', 'danger');
    }
  }

  async loadGoogleMaps() {
    try {
      // Initialize map
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: this.selectedLocation,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Add marker
      this.marker = new google.maps.Marker({
        position: this.selectedLocation,
        map: this.map,
        draggable: true,
        title: this.karenderia?.name || 'Your Karenderia Location'
      });

      // Listen for marker drag
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.selectedLocation = {
          lat: position.lat(),
          lng: position.lng()
        };
      });

      // Listen for map clicks
      this.map.addListener('click', (event: any) => {
        this.selectedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        this.marker.setPosition(this.selectedLocation);
      });

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      this.showToast('Error loading map. Please refresh the page.', 'danger');
    }
  }

  async searchLocation() {
    if (!this.searchAddress.trim()) {
      this.showToast('Please enter an address to search', 'warning');
      return;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: this.searchAddress }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          this.selectedLocation = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          this.map.setCenter(this.selectedLocation);
          this.marker.setPosition(this.selectedLocation);
          this.showToast('Location found!', 'success');
        } else {
          this.showToast('Location not found. Please try a different address.', 'warning');
        }
      });
    } catch (error) {
      console.error('Error searching location:', error);
      this.showToast('Error searching location', 'danger');
    }
  }

  async saveLocation() {
    if (!this.selectedLocation.lat || !this.selectedLocation.lng) {
      this.showToast('Please select a location on the map', 'warning');
      return;
    }

    this.isSaving = true;
    const loading = await this.loadingController.create({
      message: 'Updating location...'
    });
    await loading.present();

    try {
      // Call API to update location
      const updateData = {
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng
      };

      this.karenderiaService.updateKarenderiaLocation(updateData).subscribe({
        next: async (response: any) => {
          if (response.success) {
            await this.showToast('Location updated successfully!', 'success');
            this.router.navigate(['/karenderia-dashboard']);
          } else {
            throw new Error(response.message || 'Update failed');
          }
        },
        error: async (error) => {
          console.error('Error updating location:', error);
          await this.showToast('Error updating location. Please try again.', 'danger');
        },
        complete: async () => {
          await loading.dismiss();
          this.isSaving = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      await loading.dismiss();
      this.isSaving = false;
      await this.showToast('Error updating location', 'danger');
    }
  }

  async getCurrentLocation() {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.selectedLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.map.setCenter(this.selectedLocation);
            this.marker.setPosition(this.selectedLocation);
            this.showToast('Current location set!', 'success');
          },
          (error) => {
            console.error('Error getting location:', error);
            this.showToast('Could not get current location', 'warning');
          }
        );
      } else {
        this.showToast('Geolocation not supported', 'warning');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error getting location', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}