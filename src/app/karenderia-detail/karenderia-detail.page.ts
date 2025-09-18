import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { KarenderiaService } from '../services/karenderia.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-karenderia-detail',
  templateUrl: './karenderia-detail.page.html',
  styleUrls: ['./karenderia-detail.page.scss'],
  standalone: false,
})
export class KarenderiaDetailPage implements OnInit {
  karenderia: any = null;
  karenderiaId: string = '';
  menuItems: any[] = [];
  isLoading = true;
  selectedCategory = 'all';
  filteredMenuItems: any[] = [];
  categories: string[] = ['all'];
  cart: any[] = [];
  cartTotal = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private karenderiaService: KarenderiaService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private location: Location
  ) {}

  ngOnInit() {
    this.karenderiaId = this.route.snapshot.paramMap.get('id') || '';
    console.log('🏪 Loading karenderia details for ID:', this.karenderiaId);
    
    // Check if karenderia data was passed via router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['karenderia']) {
      this.karenderia = navigation.extras.state['karenderia'];
      console.log('✅ Received karenderia data from navigation state:', this.karenderia);
    }
    
    if (this.karenderiaId) {
      this.loadKarenderiaDetails();
      this.loadMenuItems();
    } else {
      console.error('❌ No karenderia ID provided');
      this.goBack();
    }
  }

  async loadKarenderiaDetails() {
    // If we already have karenderia data from navigation state, skip backend loading
    if (this.karenderia) {
      console.log('✅ Using karenderia data from navigation state');
      return;
    }

    try {
      const loading = await this.loadingController.create({
        message: 'Loading karenderia details...',
        duration: 3000
      });
      await loading.present();

      // Try to load from backend first
      this.karenderiaService.getKarenderiaById(this.karenderiaId).subscribe({
        next: (karenderia) => {
          if (karenderia) {
            this.karenderia = karenderia;
            console.log('✅ Loaded karenderia from backend:', karenderia);
          } else {
            // Fallback to localStorage/mock data
            this.loadKarenderiaFromLocal();
          }
          loading.dismiss();
        },
        error: (error) => {
          console.error('❌ Error loading karenderia from backend:', error);
          this.loadKarenderiaFromLocal();
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('❌ Error in loadKarenderiaDetails:', error);
      this.loadKarenderiaFromLocal();
    }
  }

  loadKarenderiaFromLocal() {
    // Fallback: try to find in localStorage or create mock data
    this.karenderiaService.getAllKarenderias_Local().subscribe({
      next: (karenderias) => {
        const found = karenderias?.find(k => k.id === this.karenderiaId);
        if (found) {
          this.karenderia = found;
          console.log('✅ Found karenderia in localStorage:', found);
        } else {
          // Create mock karenderia if not found
          this.createMockKarenderia();
        }
      },
      error: (error) => {
        console.error('❌ Error loading from localStorage:', error);
        this.createMockKarenderia();
      }
    });
  }

  createMockKarenderia() {
    // Create a mock karenderia for testing
    this.karenderia = {
      id: this.karenderiaId,
      name: "Lola Rosa's Kitchen",
      address: "123 Main St, Cebu City",
      rating: 4.8,
      cuisine: ['Filipino', 'Traditional'],
      description: "Authentic Filipino home-cooked meals made with love and traditional recipes passed down through generations.",
      contactNumber: "+63 32 123 4567",
      isOpen: true,
      openingHours: {
        monday: { open: "08:00", close: "18:00" },
        tuesday: { open: "08:00", close: "18:00" },
        wednesday: { open: "08:00", close: "18:00" },
        thursday: { open: "08:00", close: "18:00" },
        friday: { open: "08:00", close: "18:00" },
        saturday: { open: "08:00", close: "18:00" },
        sunday: { open: "09:00", close: "17:00" }
      }
    };
    console.log('📋 Created mock karenderia data');
  }

  async loadMenuItems() {
    if (!this.karenderia?.id) {
      console.log('⚠️ No karenderia ID available, using mock data');
      this.createMockMenuItems();
      this.isLoading = false;
      return;
    }

    try {
      console.log('🍽️ Loading menu items for karenderia:', this.karenderia.id);
      
      // Try to load from backend API first
      this.karenderiaService.getMenuItemsForKarenderia(this.karenderia.id).subscribe({
        next: (menuItems) => {
          if (menuItems && menuItems.length > 0) {
            console.log('✅ Loaded', menuItems.length, 'menu items from backend');
            // Transform to our component's MenuItem interface
            this.menuItems = menuItems.map(item => ({
              id: item.id || Math.random().toString(),
              name: item.name,
              description: item.description || 'Delicious Filipino dish',
              price: item.price,
              category: this.mapToLocalCategory(item.category),
              image: item.imageUrl || 'assets/images/food-placeholder.jpg',
              available: item.isAvailable,
              spicyLevel: 'Mild' // Default value
            }));
            this.filterMenuItems();
          } else {
            console.log('⚠️ No menu items found in backend, using mock data');
            this.createMockMenuItems();
          }
        },
        error: (error) => {
          console.error('❌ Error loading menu items from backend:', error);
          console.log('📋 Falling back to mock menu data');
          this.createMockMenuItems();
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Error in loadMenuItems:', error);
      this.createMockMenuItems();
      this.isLoading = false;
    }
  }

  // Helper method to map service categories to component categories
  private mapToLocalCategory(serviceCategory: string): string {
    const categoryMap: { [key: string]: string } = {
      'Main Dish': 'Main Course',
      'Appetizer': 'Appetizers', 
      'Dessert': 'Desserts',
      'Beverage': 'Beverages',
      'Side Dish': 'Sides'
    };
    return categoryMap[serviceCategory] || 'Main Course';
  }

  createMockMenuItems() {
    // Mock menu items for testing
    this.menuItems = [
      {
        id: '1',
        name: 'Adobo',
        description: 'Classic Filipino adobo with tender pork and chicken in savory soy-vinegar sauce',
        price: 120,
        category: 'Main Course',
        image: 'assets/images/adobo.jpg',
        available: true,
        spicyLevel: 'Mild'
      },
      {
        id: '2',
        name: 'Lechon Kawali',
        description: 'Crispy deep-fried pork belly served with liver sauce',
        price: 180,
        category: 'Main Course',
        image: 'assets/images/lechon-kawali.jpg',
        available: true,
        spicyLevel: 'None'
      },
      {
        id: '3',
        name: 'Sinigang na Baboy',
        description: 'Sour pork soup with vegetables in tamarind broth',
        price: 150,
        category: 'Soup',
        image: 'assets/images/sinigang.jpg',
        available: true,
        spicyLevel: 'None'
      },
      {
        id: '4',
        name: 'Lumpia Shanghai',
        description: 'Crispy spring rolls filled with seasoned ground pork',
        price: 80,
        category: 'Appetizer',
        image: 'assets/images/lumpia.jpg',
        available: true,
        spicyLevel: 'None'
      },
      {
        id: '5',
        name: 'Pancit Canton',
        description: 'Stir-fried noodles with mixed vegetables and meat',
        price: 100,
        category: 'Noodles',
        image: 'assets/images/pancit.jpg',
        available: true,
        spicyLevel: 'None'
      },
      {
        id: '6',
        name: 'Halo-Halo',
        description: 'Traditional Filipino shaved ice dessert with mixed fruits and ube',
        price: 85,
        category: 'Dessert',
        image: 'assets/images/halo-halo.jpg',
        available: true,
        spicyLevel: 'None'
      }
    ];

    // Extract categories
    this.categories = ['all', ...new Set(this.menuItems.map(item => item.category))];
    this.filteredMenuItems = [...this.menuItems];
    
    console.log('✅ Mock menu items created:', this.menuItems.length);
    console.log('📂 Categories:', this.categories);
  }

  setCategory(category: string) {
    this.selectedCategory = category;
    this.filterMenuItems();
  }

  filterMenuItems() {
    if (this.selectedCategory === 'all') {
      // Filter to show only available items
      this.filteredMenuItems = this.menuItems.filter(item => item.available === true || item.available === undefined);
    } else {
      // Filter by category AND availability
      this.filteredMenuItems = this.menuItems.filter(item => 
        item.category === this.selectedCategory && 
        (item.available === true || item.available === undefined)
      );
    }
    console.log(`🔍 Filtered menu items for category "${this.selectedCategory}" (available only):`, this.filteredMenuItems.length);
  }

  async viewMealDetails(menuItem: any) {
    console.log('🍽️ Viewing meal details for:', menuItem.name);
    
    try {
      // Navigate to meal details page with menu item data
      await this.router.navigate(['/meal-details', menuItem.id], {
        state: { 
          menuItem: menuItem,
          karenderia: this.karenderia 
        }
      });
      
      console.log('✅ Successfully navigated to meal details page');
    } catch (error) {
      console.error('❌ Error navigating to meal details:', error);
      const toast = await this.toastController.create({
        message: 'Unable to view meal details at this time',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async addToCart(menuItem: any) {
    if (!menuItem.available) {
      const toast = await this.toastController.create({
        message: 'This item is currently unavailable',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Check if item already in cart
    const existingItem = this.cart.find(item => item.id === menuItem.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        ...menuItem,
        quantity: 1
      });
    }

    this.calculateCartTotal();

    const toast = await this.toastController.create({
      message: `${menuItem.name} added to cart!`,
      duration: 1500,
      color: 'success'
    });
    await toast.present();

    console.log('🛒 Updated cart:', this.cart);
  }

  async removeFromCart(menuItem: any) {
    const existingItem = this.cart.find(item => item.id === menuItem.id);
    
    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1;
      } else {
        this.cart = this.cart.filter(item => item.id !== menuItem.id);
      }
      
      this.calculateCartTotal();

      const toast = await this.toastController.create({
        message: `${menuItem.name} removed from cart`,
        duration: 1500,
        color: 'medium'
      });
      await toast.present();
    }
  }

  getItemQuantityInCart(menuItem: any): number {
    const cartItem = this.cart.find(item => item.id === menuItem.id);
    return cartItem ? cartItem.quantity : 0;
  }

  calculateCartTotal() {
    this.cartTotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  async viewCart() {
    if (this.cart.length === 0) {
      const toast = await this.toastController.create({
        message: 'Your cart is empty',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Navigate to cart/checkout page (you can implement this)
    const alert = await this.alertController.create({
      header: 'Cart Summary',
      message: `You have ${this.cart.length} items in your cart. Total: ₱${this.cartTotal}`,
      buttons: [
        {
          text: 'Continue Shopping',
          role: 'cancel'
        },
        {
          text: 'Checkout',
          handler: () => {
            console.log('🛒 Proceeding to checkout...', this.cart);
            // Implement checkout navigation here
          }
        }
      ]
    });

    await alert.present();
  }

  async callKarenderia() {
    if (this.karenderia?.contactNumber) {
      window.open(`tel:${this.karenderia.contactNumber}`);
    } else {
      const toast = await this.toastController.create({
        message: 'Contact number not available',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  goBack() {
    this.location.back();
  }
}
