import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { KarenderiaService, SimpleKarenderia } from '../services/karenderia.service';
import { ComponentsModule } from '../components/components.module';

@Component({
  selector: 'app-customer-map',
  templateUrl: './customer-map.page.html',
  styleUrls: ['./customer-map.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule
  ]
})
export class CustomerMapPage implements OnInit, OnDestroy {
  // Location and Map
  currentLat = 10.3157; // Default to Cebu City
  currentLng = 123.8854;
  mapZoom = 13;

  // UI State
  isLoading = false;
  rangeChangeTimeout: any;

  // Filters
  selectedFilter = 'all';
  searchQuery = '';
  searchRadius = 1000; // meters

  // Karenderias data
  karenderias: SimpleKarenderia[] = [];

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router,
    private karenderiaService: KarenderiaService
  ) {}

  async ngOnInit() {
    console.log('CustomerMapPage initialized');
    await this.getCurrentLocation();
    await this.loadKarenderias();
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.currentLat = position.coords.latitude;
      this.currentLng = position.coords.longitude;
      console.log('Current location:', this.currentLat, this.currentLng);
    } catch (error) {
      console.error('Error getting location:', error);
      // Keep default Manila location
    }
  }

  async loadKarenderias() {
    this.isLoading = true;
    try {
      console.log('Loading karenderias for customer map...');
      
      // Use the karenderia service to fetch nearby karenderias
      this.karenderiaService.getNearbyKarenderias(
        this.currentLat,
        this.currentLng,
        this.searchRadius
      ).subscribe({
        next: (karenderias) => {
          // Convert to SimpleKarenderia format if needed
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
          console.log('Loaded karenderias:', this.karenderias.length);
        },
        error: (error) => {
          console.error('Error loading karenderias:', error);
          this.karenderias = [];
        }
      });
    } catch (error) {
      console.error('Error loading karenderias:', error);
      this.karenderias = [];
    } finally {
      this.isLoading = false;
    }
  }

  onFilterChange(filter: string) {
    console.log('Filter changed to:', filter);
    this.selectedFilter = filter;
    // Filtering is now handled by the API call with search radius
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    console.log('Search query:', this.searchQuery);
    // Search functionality can be implemented here if needed
  }

  async onRangeChange() {
    console.log('Search radius changed to:', this.searchRadius);
    
    // Clear any existing timeout to debounce the search
    if (this.rangeChangeTimeout) {
      clearTimeout(this.rangeChangeTimeout);
    }
    
    // Debounce the search to avoid too many API calls
    this.rangeChangeTimeout = setTimeout(async () => {
      // Show loading indicator for better UX
      const loading = await this.loadingController.create({
        message: `Searching within ${this.formatSearchRadius()}...`,
        duration: 5000
      });
      await loading.present();
      
      try {
        // Reload karenderias with new radius
        await this.loadKarenderias();
        console.log(`Found ${this.karenderias.length} karenderias within ${this.formatSearchRadius()}`);
        
        // Show success toast
        await this.showToast(`Found ${this.karenderias.length} karenderias within ${this.formatSearchRadius()}`);
      } catch (error) {
        console.error('Error loading karenderias with new radius:', error);
        await this.showToast('Error searching karenderias. Please try again.', 'danger');
      } finally {
        loading.dismiss();
      }
    }, 800); // Wait 800ms after user stops sliding
  }

  formatSearchRadius(): string {
    if (this.searchRadius >= 1000) {
      return `${(this.searchRadius / 1000).toFixed(1)}km`;
    }
    return `${this.searchRadius}m`;
  }

  async refreshLocation() {
    const loading = await this.loadingController.create({
      message: 'Getting your location...',
      duration: 3000
    });
    await loading.present();

    try {
      await this.getCurrentLocation();
      await this.loadKarenderias();
    } catch (error) {
      console.error('Error refreshing location:', error);
    } finally {
      loading.dismiss();
    }
  }

  async clearRoutes() {
    console.log('Clearing routes');
    // TODO: Implement route clearing logic
    const alert = await this.alertController.create({
      header: 'Clear Routes',
      message: 'Are you sure you want to clear all routes?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Clear',
          handler: () => {
            console.log('Routes cleared');
            // Implement actual route clearing
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  // Handle karenderia selection from list or map
  selectKarenderia(karenderia: SimpleKarenderia) {
    console.log('Selected karenderia:', karenderia);
    // TODO: Navigate to karenderia details or show info
    // For now, just show an alert with karenderia info
    this.showKarenderiaInfo(karenderia);
  }

  async showKarenderiaInfo(karenderia: SimpleKarenderia) {
    const alert = await this.alertController.create({
      header: karenderia.name,
      subHeader: karenderia.address,
      message: `
        <p><strong>Rating:</strong> ${karenderia.rating || 'Not rated'}</p>
        <p><strong>Price Range:</strong> ${karenderia.priceRange}</p>
        <p><strong>Distance:</strong> ${karenderia.distance ? Math.round(karenderia.distance) + 'm' : 'Unknown'}</p>
        ${karenderia.description ? `<p><strong>Description:</strong> ${karenderia.description}</p>` : ''}
      `,
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        },
        {
          text: 'View Menu',
          handler: () => {
            // TODO: Navigate to karenderia menu page
            console.log('Navigate to menu for:', karenderia.id);
          }
        }
      ]
    });
    await alert.present();
  }

  ngOnDestroy() {
    // Cleanup timeout to prevent memory leaks
    if (this.rangeChangeTimeout) {
      clearTimeout(this.rangeChangeTimeout);
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}