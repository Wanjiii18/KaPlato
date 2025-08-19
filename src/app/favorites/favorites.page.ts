import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FavoritesService, FavoriteItem } from '../services/favorites.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FavoritesPage implements OnInit, OnDestroy {
  favorites: FavoriteItem[] = [];
  filteredFavorites: FavoriteItem[] = [];
  searchQuery = '';
  loading = true;
  selectedFilter = 'all';

  private subscriptions: Subscription[] = [];

  constructor(
    private favoritesService: FavoritesService,
    private navController: NavController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.favorites = favorites;
        this.applyFilters();
        this.loading = false;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async ionViewWillEnter() {
    this.loading = true;
    await this.favoritesService.loadFavorites();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.favorites;

    // Apply search filter
    if (this.searchQuery.trim()) {
      filtered = this.favoritesService.searchFavorites(this.searchQuery.trim());
    }

    // Apply category/price filters if needed
    switch (this.selectedFilter) {
      case 'price-low':
        filtered = filtered.sort((a, b) => a.menuItemPrice - b.menuItemPrice);
        break;
      case 'price-high':
        filtered = filtered.sort((a, b) => b.menuItemPrice - a.menuItemPrice);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
        break;
      case 'alphabetical':
        filtered = filtered.sort((a, b) => 
          a.menuItemName.localeCompare(b.menuItemName)
        );
        break;
    }

    this.filteredFavorites = filtered;
  }

  async removeFromFavorites(favorite: FavoriteItem) {
    const alert = await this.alertController.create({
      header: 'Remove Favorite',
      message: `Remove "${favorite.menuItemName}" from your favorites?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            try {
              await this.favoritesService.removeFromFavorites(favorite.id);
              await this.showToast('Removed from favorites');
            } catch (error) {
              console.error('Error removing favorite:', error);
              await this.showErrorToast('Failed to remove from favorites');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  goToMealDetails(favorite: FavoriteItem) {
    this.navController.navigateForward(['/meal-details', favorite.menuItemId]);
  }

  goToKarenderia(favorite: FavoriteItem) {
    this.navController.navigateForward(['/karenderia', favorite.karenderiaId]);
  }

  async addToCart(favorite: FavoriteItem) {
    try {
      // Assuming you have a cart service
      // await this.cartService.addToCart({
      //   menuItemId: favorite.menuItemId,
      //   karenderiaId: favorite.karenderiaId,
      //   quantity: 1
      // });
      
      await this.showToast(`Added ${favorite.menuItemName} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      await this.showErrorToast('Failed to add to cart');
    }
  }

  async clearAllFavorites() {
    if (this.favorites.length === 0) return;

    const alert = await this.alertController.create({
      header: 'Clear All Favorites',
      message: 'Are you sure you want to remove all items from your favorites? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: async () => {
            try {
              for (const favorite of this.favorites) {
                await this.favoritesService.removeFromFavorites(favorite.id);
              }
              await this.showToast('All favorites cleared');
            } catch (error) {
              console.error('Error clearing favorites:', error);
              await this.showErrorToast('Failed to clear favorites');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  trackByFavoriteId(index: number, favorite: FavoriteItem): string {
    return favorite.id;
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
