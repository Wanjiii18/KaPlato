import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../services/favorites.service';
import { MenuService } from '../services/menu.service';

export interface MenuItemDetails {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  karenderia_id: string;
  karenderia_name: string;
  karenderia_address?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
  ingredients?: string[];
  dietary_tags?: string[];
  spiciness_level?: number;
  preparation_time?: number;
  average_rating?: number;
  total_reviews?: number;
  reviews?: Review[];
  available: boolean;
  category?: string;
}

export interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: Date;
  helpful_count?: number;
}

@Component({
  selector: 'app-meal-details',
  templateUrl: './meal-details.page.html',
  styleUrls: ['./meal-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MealDetailsPage implements OnInit, OnDestroy {
  menuItem: MenuItemDetails | null = null;
  loading = true;
  isFavorite = false;
  favoriteId: string | null = null;
  quantity = 1;
  selectedSpiciness = 1;
  specialInstructions = '';
  showAllReviews = false;
  userRating = 0;
  userReview = '';
  showReviewForm = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    private favoritesService: FavoritesService,
    private menuService: MenuService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const menuItemId = this.route.snapshot.paramMap.get('id');
    if (menuItemId) {
      await this.loadMenuItemDetails(menuItemId);
      this.checkIfFavorite(menuItemId);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadMenuItemDetails(id: string) {
    this.loading = true;
    try {
      this.menuItem = await this.menuService.getMenuItemDetails(id);
    } catch (error) {
      console.error('Error loading menu item:', error);
      await this.showErrorToast('Failed to load meal details');
      this.navController.back();
    } finally {
      this.loading = false;
    }
  }

  checkIfFavorite(menuItemId: string) {
    this.isFavorite = this.favoritesService.isFavorite(menuItemId);
    this.favoriteId = this.favoritesService.getFavoriteId(menuItemId);
  }

  async toggleFavorite() {
    if (!this.menuItem) return;

    const loading = await this.loadingController.create({
      message: this.isFavorite ? 'Removing from favorites...' : 'Adding to favorites...'
    });
    await loading.present();

    try {
      if (this.isFavorite && this.favoriteId) {
        await this.favoritesService.removeFromFavorites(this.favoriteId);
        await this.showToast('Removed from favorites');
      } else {
        await this.favoritesService.addToFavorites(this.menuItem.id, this.menuItem.karenderia_id);
        await this.showToast('Added to favorites');
      }
      
      this.checkIfFavorite(this.menuItem.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showErrorToast('Failed to update favorites');
    } finally {
      await loading.dismiss();
    }
  }

  async addToCart() {
    if (!this.menuItem) return;

    const loading = await this.loadingController.create({
      message: 'Adding to cart...'
    });
    await loading.present();

    try {
      const orderData = {
        menuItemId: this.menuItem.id,
        karenderiaId: this.menuItem.karenderia_id,
        quantity: this.quantity,
        spiciness: this.selectedSpiciness,
        specialInstructions: this.specialInstructions
      };

      // Assuming you have a cart service
      // await this.cartService.addToCart(orderData);
      
      await this.showToast(`Added ${this.quantity} ${this.menuItem.name} to cart`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      await this.showErrorToast('Failed to add to cart');
    } finally {
      await loading.dismiss();
    }
  }

  async submitReview() {
    if (!this.menuItem || this.userRating === 0) {
      await this.showErrorToast('Please provide a rating');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting review...'
    });
    await loading.present();

    try {
      // Submit review to backend
      await this.menuService.submitReview(this.menuItem.id, this.userRating, this.userReview);
      
      await this.showToast('Review submitted successfully');
      this.showReviewForm = false;
      this.userRating = 0;
      this.userReview = '';
      
      // Reload menu item to get updated reviews
      await this.loadMenuItemDetails(this.menuItem.id);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      await this.showErrorToast('Failed to submit review');
    } finally {
      await loading.dismiss();
    }
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('star');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('star-half');
      } else {
        stars.push('star-outline');
      }
    }
    return stars;
  }

  setUserRating(rating: number) {
    this.userRating = rating;
  }

  incrementQuantity() {
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getVisibleReviews(): Review[] {
    if (!this.menuItem?.reviews) return [];
    return this.showAllReviews ? this.menuItem.reviews : this.menuItem.reviews.slice(0, 3);
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  async goToKarenderia() {
    if (this.menuItem?.karenderia_id) {
      this.navController.navigateForward(['/karenderia', this.menuItem.karenderia_id]);
    }
  }

  goBack() {
    this.navController.back();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
