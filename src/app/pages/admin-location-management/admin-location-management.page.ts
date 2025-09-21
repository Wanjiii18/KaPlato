import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  timeOutline, restaurantOutline, locationOutline, map, checkmark, pencil, 
  eye, close, informationCircleOutline, search, save, warning, location,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { AdminService } from 'src/app/services/admin.service';
import { GoogleMapsService } from 'src/app/services/google-maps.service';
import { LoggerService } from 'src/app/services/logger.service';

declare var google: any;

@Component({
  selector: 'app-admin-location-management',
  templateUrl: './admin-location-management.page.html',
  styleUrls: ['./admin-location-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class AdminLocationManagementPage implements OnInit {
  @ViewChild('adminMapContainer', { static: false }) adminMapContainer!: ElementRef;

  pendingKarenderias: any[] = [];
  activeKarenderias: any[] = [];
  
  isLocationModalOpen = false;
  selectedKarenderia: any = null;
  searchAddress = '';
  isSaving = false;
  mapLoaded = false;
  
  map: any;
  marker: any;
  selectedLocation = { lat: 0, lng: 0 };

  constructor(
    private adminService: AdminService,
    private googleMapsService: GoogleMapsService,
    private logger: LoggerService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    addIcons({
      timeOutline,
      restaurantOutline,
      locationOutline,
      map,
      checkmark,
      pencil,
      eye,
      close,
      informationCircleOutline,
      search,
      save,
      warning,
      location,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.loadKarenderias();
  }

  async loadKarenderias() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Loading karenderias...'
      });
      await loading.present();

      // Load pending (approved but no location) and active karenderias
      const response = await this.adminService.getAllKarenderias().toPromise();
      
      if (response) {
        this.pendingKarenderias = response.filter((k: any) => 
          k.status === 'approved' && (!k.latitude || !k.longitude)
        );
        
        this.activeKarenderias = response.filter((k: any) => 
          k.status === 'active' && k.latitude && k.longitude
        );
      } else {
        this.pendingKarenderias = [];
        this.activeKarenderias = [];
      }

      await loading.dismiss();
    } catch (error) {
      console.error('Error loading karenderias:', error);
      await this.showToast('Error loading karenderias', 'danger');
    }
  }

  async refreshData() {
    await this.loadKarenderias();
    await this.showToast('Data refreshed successfully', 'success');
  }

  setKarenderiaLocation(karenderia: any) {
    this.selectedKarenderia = karenderia;
    this.searchAddress = `${karenderia.address}, ${karenderia.city}, ${karenderia.province}`;
    this.mapLoaded = false;
    this.isLocationModalOpen = true;
    
    // Load map after modal opens
    setTimeout(() => {
      this.loadAdminMap();
    }, 500);
  }

  editKarenderiaLocation(karenderia: any) {
    this.selectedKarenderia = karenderia;
    this.selectedLocation = {
      lat: parseFloat(karenderia.latitude),
      lng: parseFloat(karenderia.longitude)
    };
    this.searchAddress = `${karenderia.address}, ${karenderia.city}, ${karenderia.province}`;
    this.isLocationModalOpen = true;
    
    setTimeout(() => {
      this.loadAdminMap();
    }, 500);
  }

  async loadAdminMap() {
    try {
      await this.googleMapsService.loadGoogleMaps();
    } catch (error) {
      this.logger.error('Failed to load Google Maps:', error);
      return;
    }

    if (!this.adminMapContainer?.nativeElement) {
      setTimeout(() => {
        this.loadAdminMap();
      }, 500);
      return;
    }

    try {
      // Default to Philippines center, or use existing location
      const defaultLat = this.selectedLocation.lat || 10.3157;
      const defaultLng = this.selectedLocation.lng || 120.9842;
      
      const mapOptions = {
        center: new google.maps.LatLng(defaultLat, defaultLng),
        zoom: this.selectedLocation.lat ? 17 : 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'cooperative',
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      };

      this.map = new google.maps.Map(this.adminMapContainer.nativeElement, mapOptions);

      // Set mapLoaded to true when map is ready
      this.mapLoaded = true;

      // Add draggable marker
      this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(defaultLat, defaultLng),
        map: this.map,
        draggable: true,
        title: 'Drag to set karenderia location'
      });

      // Update coordinates when marker is dragged
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.ngZone.run(() => {
          this.selectedLocation = {
            lat: position.lat(),
            lng: position.lng()
          };
        });
      });

      // Set initial location
      this.selectedLocation = { lat: defaultLat, lng: defaultLng };

      // Auto-search the address if available
      if (this.searchAddress) {
        setTimeout(() => {
          this.searchLocation();
        }, 1000);
      }

    } catch (error) {
      console.error('Error loading admin map:', error);
      this.showToast('Error loading map', 'danger');
    }
  }

  searchLocation() {
    if (!this.searchAddress || !this.map) return;

    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: this.searchAddress }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        this.map.setCenter(location);
        this.map.setZoom(17);
        this.marker.setPosition(location);
        
        this.selectedLocation = { lat, lng };
        
        this.showToast('Location found! Adjust the marker if needed.', 'success');
      } else {
        this.showToast('Address not found. Please try a different search.', 'warning');
      }
    });
  }

  async saveLocation() {
    if (!this.selectedLocation.lat || !this.selectedLocation.lng) {
      await this.showToast('Please set a location on the map', 'warning');
      return;
    }

    this.isSaving = true;

    try {
      const updateData = {
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng
      };

      await this.adminService.updateKarenderiaLocation(this.selectedKarenderia.id, updateData).toPromise();
      
      await this.showToast('Location saved successfully!', 'success');
      this.closeLocationModal();
      this.loadKarenderias(); // Refresh the list
      
    } catch (error) {
      console.error('Error saving location:', error);
      await this.showToast('Error saving location', 'danger');
    }
    
    this.isSaving = false;
  }

  async approveKarenderia(karenderia: any) {
    if (!karenderia.latitude || !karenderia.longitude) {
      await this.showToast('Please set the location first before approving', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Approve Karenderia',
      message: `Are you sure you want to approve "${karenderia.business_name}"? This will make it visible to customers.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          handler: async () => {
            try {
              await this.adminService.updateKarenderiaStatus(karenderia.id, 'active').toPromise();
              await this.showToast('Karenderia approved successfully!', 'success');
              this.loadKarenderias();
            } catch (error) {
              console.error('Error approving karenderia:', error);
              await this.showToast('Error approving karenderia', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  viewOnMap(karenderia: any) {
    const lat = parseFloat(karenderia.latitude);
    const lng = parseFloat(karenderia.longitude);
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  }

  closeLocationModal() {
    this.isLocationModalOpen = false;
    this.selectedKarenderia = null;
    this.searchAddress = '';
    this.selectedLocation = { lat: 0, lng: 0 };
    this.map = null;
    this.marker = null;
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
