import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KarenderiaService } from '../services/karenderia.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-karenderias-browse',
  templateUrl: './karenderias-browse.page.html',
  styleUrls: ['./karenderias-browse.page.scss'],
  standalone: false,
})
export class KarenderiasBrowsePage implements OnInit {
  karenderias: any[] = [];
  filteredKarenderias: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedCategory = 'all';
  selectedSort = 'rating';

  categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'open', name: 'Open Now', icon: 'checkmark-circle-outline' },
    { id: 'nearby', name: 'Nearby', icon: 'location-outline' },
    { id: 'popular', name: 'Popular', icon: 'star-outline' },
    { id: 'budget', name: 'Budget-Friendly', icon: 'cash-outline' }
  ];

  sortOptions = [
    { id: 'rating', name: 'Rating' },
    { id: 'distance', name: 'Distance' },
    { id: 'name', name: 'Name' }
  ];

  constructor(
    private router: Router,
    private karenderiaService: KarenderiaService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadKarenderias();
  }

  async loadKarenderias() {
    try {
      // Load karenderias from backend API
      this.karenderiaService.getAllKarenderias().subscribe({
        next: (karenderias) => {
          if (karenderias && karenderias.length > 0) {
            this.karenderias = karenderias.map(k => ({
              id: k.id,
              name: k.name || 'Unknown Karenderia',
              address: k.address || 'No address',
              location: { 
                latitude: k.location?.latitude || k.latitude || 10.3157, 
                longitude: k.location?.longitude || k.longitude || 120.9842 
              },
              rating: k.rating || k.average_rating || 4.0,
              priceRange: 'Budget',
              cuisine: ['Filipino', 'Traditional'],
              deliveryTime: k.deliveryTime || `${k.delivery_time_minutes || 30} min`,
              deliveryFee: k.deliveryFee || 25,
              isOpen: k.isOpen !== undefined ? k.isOpen : true,
              imageUrl: k.imageUrl || 'assets/images/karenderia-placeholder.jpg',
              distance: this.calculateMockDistance()
            }));
            console.log('✅ Loaded karenderias from backend:', this.karenderias.length);
          } else {
            this.loadMockKarenderias();
          }
          this.applyFilters();
        },
        error: (error) => {
          console.error('❌ Error loading karenderias from backend:', error);
          this.loadMockKarenderias();
          this.applyFilters();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Error in loadKarenderias:', error);
      this.loadMockKarenderias();
      this.applyFilters();
      this.isLoading = false;
    }
  }

  loadMockKarenderias() {
    // Fallback mock data for demonstration
    this.karenderias = [
      {
        id: 'mock-1',
        name: "Lola Maria's Kitchen",
        address: "123 Mabini Street, Mandaue City, Cebu",
        location: { latitude: 10.3231, longitude: 123.9319 },
        rating: 4.8,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Traditional'],
        deliveryTime: '25 min',
        deliveryFee: 20,
        isOpen: true,
        imageUrl: 'assets/images/karenderia1.jpg',
        distance: 0.8
      },
      {
        id: 'mock-2',
        name: "Tita Linda's Lutong Bahay",
        address: "456 Plaridel Street, Mandaue City, Cebu",
        location: { latitude: 10.3241, longitude: 123.9329 },
        rating: 4.6,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Home-cooked'],
        deliveryTime: '30 min',
        deliveryFee: 25,
        isOpen: true,
        imageUrl: 'assets/images/karenderia2.jpg',
        distance: 1.2
      },
      {
        id: 'mock-3',
        name: "Kuya Roberto's Place",
        address: "789 Burgos Street, Mandaue City, Cebu",
        location: { latitude: 10.3221, longitude: 123.9309 },
        rating: 4.4,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Grilled'],
        deliveryTime: '35 min',
        deliveryFee: 30,
        isOpen: false,
        imageUrl: 'assets/images/karenderia3.jpg',
        distance: 1.5
      },
      {
        id: 'mock-4',
        name: "Nanay Cora's Carinderia",
        address: "321 Rizal Avenue, Mandaue City, Cebu",
        location: { latitude: 10.3251, longitude: 123.9339 },
        rating: 4.7,
        priceRange: 'Budget',
        cuisine: ['Filipino', 'Seafood'],
        deliveryTime: '28 min',
        deliveryFee: 22,
        isOpen: true,
        imageUrl: 'assets/images/karenderia4.jpg',
        distance: 0.9
      }
    ];
    console.log('📋 Loaded mock karenderias:', this.karenderias.length);
  }

  calculateMockDistance(): number {
    return Math.random() * 2 + 0.5; // Random distance between 0.5-2.5 km
  }

  onSearchChange() {
    this.applyFilters();
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.karenderias];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(query) ||
        k.address.toLowerCase().includes(query) ||
        k.cuisine.some((c: string) => c.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    switch (this.selectedCategory) {
      case 'open':
        filtered = filtered.filter(k => k.isOpen);
        break;
      case 'nearby':
        filtered = filtered.filter(k => k.distance <= 1.0);
        break;
      case 'popular':
        filtered = filtered.filter(k => k.rating >= 4.5);
        break;
      case 'budget':
        filtered = filtered.filter(k => k.priceRange === 'Budget');
        break;
    }

    // Apply sorting
    switch (this.selectedSort) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.filteredKarenderias = filtered;
    console.log(`🔍 Applied filters: ${filtered.length} karenderias found`);
  }

  async selectKarenderia(karenderia: any) {
    console.log('🏪 Selected karenderia:', karenderia.name);
    
    try {
      // Navigate to karenderia detail page with the karenderia data
      await this.router.navigate(['/karenderia-detail', karenderia.id], {
        state: { karenderia: karenderia }
      });
      
      console.log('✅ Successfully navigated to karenderia detail page');
    } catch (error) {
      console.error('❌ Error navigating to karenderia detail:', error);
      await this.showToast('Unable to view karenderia menu at this time');
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
