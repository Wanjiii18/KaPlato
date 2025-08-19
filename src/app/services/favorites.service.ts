import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FavoriteItem {
  id: string;
  userId: string;
  menuItemId: string;
  karenderiaId: string;
  menuItemName: string;
  menuItemImage?: string;
  menuItemPrice: number;
  karenderiaName: string;
  addedAt: Date;
}

export interface MealHistory {
  id: string;
  userId: string;
  menuItemId: string;
  karenderiaId: string;
  menuItemName: string;
  menuItemImage?: string;
  menuItemPrice: number;
  karenderiaName: string;
  orderedAt: Date;
  quantity: number;
  rating?: number;
  review?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = environment.apiUrl;
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
  private historySubject = new BehaviorSubject<MealHistory[]>([]);

  public favorites$ = this.favoritesSubject.asObservable();
  public history$ = this.historySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFavorites();
    this.loadHistory();
  }

  // Favorites Management
  async loadFavorites(): Promise<void> {
    try {
      const favorites = await this.http.get<FavoriteItem[]>(`${this.apiUrl}/user/favorites`).toPromise();
      this.favoritesSubject.next(favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoritesSubject.next([]);
    }
  }

  async addToFavorites(menuItemId: string, karenderiaId: string): Promise<void> {
    try {
      const response = await this.http.post<FavoriteItem>(`${this.apiUrl}/user/favorites`, {
        menuItemId,
        karenderiaId
      }).toPromise();

      if (response) {
        const currentFavorites = this.favoritesSubject.value;
        this.favoritesSubject.next([...currentFavorites, response]);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(favoriteId: string): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/user/favorites/${favoriteId}`).toPromise();
      
      const currentFavorites = this.favoritesSubject.value;
      const updatedFavorites = currentFavorites.filter(fav => fav.id !== favoriteId);
      this.favoritesSubject.next(updatedFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  isFavorite(menuItemId: string): boolean {
    const favorites = this.favoritesSubject.value;
    return favorites.some(fav => fav.menuItemId === menuItemId);
  }

  getFavoriteId(menuItemId: string): string | null {
    const favorites = this.favoritesSubject.value;
    const favorite = favorites.find(fav => fav.menuItemId === menuItemId);
    return favorite ? favorite.id : null;
  }

  // Meal History Management
  async loadHistory(): Promise<void> {
    try {
      const history = await this.http.get<MealHistory[]>(`${this.apiUrl}/user/meal-history`).toPromise();
      this.historySubject.next(history || []);
    } catch (error) {
      console.error('Error loading meal history:', error);
      this.historySubject.next([]);
    }
  }

  async addToHistory(orderData: {
    menuItemId: string;
    karenderiaId: string;
    quantity: number;
    orderId: string;
  }): Promise<void> {
    try {
      const response = await this.http.post<MealHistory>(`${this.apiUrl}/user/meal-history`, orderData).toPromise();
      
      if (response) {
        const currentHistory = this.historySubject.value;
        this.historySubject.next([response, ...currentHistory]);
      }
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  async addReview(historyId: string, rating: number, review?: string): Promise<void> {
    try {
      await this.http.put(`${this.apiUrl}/user/meal-history/${historyId}/review`, {
        rating,
        review
      }).toPromise();

      const currentHistory = this.historySubject.value;
      const updatedHistory = currentHistory.map(item => 
        item.id === historyId ? { ...item, rating, review } : item
      );
      this.historySubject.next(updatedHistory);
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // Search in favorites and history
  searchFavorites(query: string): FavoriteItem[] {
    const favorites = this.favoritesSubject.value;
    return favorites.filter(fav => 
      fav.menuItemName.toLowerCase().includes(query.toLowerCase()) ||
      fav.karenderiaName.toLowerCase().includes(query.toLowerCase())
    );
  }

  searchHistory(query: string): MealHistory[] {
    const history = this.historySubject.value;
    return history.filter(item => 
      item.menuItemName.toLowerCase().includes(query.toLowerCase()) ||
      item.karenderiaName.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get frequently ordered items
  getFrequentlyOrdered(): MealHistory[] {
    const history = this.historySubject.value;
    const itemCounts = new Map<string, { item: MealHistory; count: number }>();

    history.forEach(item => {
      const key = `${item.menuItemId}-${item.karenderiaId}`;
      if (itemCounts.has(key)) {
        itemCounts.get(key)!.count += item.quantity;
      } else {
        itemCounts.set(key, { item, count: item.quantity });
      }
    });

    return Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(entry => entry.item);
  }

  // Get recent orders
  getRecentOrders(limit: number = 5): MealHistory[] {
    const history = this.historySubject.value;
    return history
      .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
      .slice(0, limit);
  }
}
