import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { KarenderiaService } from '../services/karenderia.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.page.html',
  styleUrls: ['./map-view.page.scss'],
  standalone: false,
})
export class MapViewPage implements OnInit {
  searchQuery = '';
  selectedFilter = 'all';
  showList = false;
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
    private karenderiaService: KarenderiaService
  ) {}

  ngOnInit() {
    this.loadKarenderias();
    this.getCurrentLocation();
  }

  async loadKarenderias() {
    try {
      // Load karenderias from service
      this.karenderiaService.getAllKarenderias().subscribe({
        next: (response) => {
          this.karenderias = response || [];
          this.filteredKarenderias = [...this.karenderias];
          this.applyFilter();
        },
        error: (error) => {
          console.error('Error loading karenderias:', error);
          // Load mock data if service fails
          this.loadMockData();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.loadMockData();
    }
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
    }

    this.filteredKarenderias = filtered;
  }

  toggleListView() {
    this.showList = !this.showList;
  }

  selectKarenderia(karenderia: any) {
    // Handle karenderia selection - could navigate to detail page or show info
    console.log('Selected karenderia:', karenderia);
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
