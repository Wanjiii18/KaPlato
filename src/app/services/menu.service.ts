import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem, Ingredient, MenuCategory, DailySales, MenuIngredient } from '../models/menu.model';
import { EnhancedNutritionService, MenuItemNutrition } from './enhanced-nutrition.service';
import { SpoonacularService } from './spoonacular.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.apiUrl;
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  private categoriesSubject = new BehaviorSubject<MenuCategory[]>([]);

  menuItems$ = this.menuItemsSubject.asObservable();
  ingredients$ = this.ingredientsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private enhancedNutritionService: EnhancedNutritionService,
    private spoonacularService: SpoonacularService
  ) {
    // Load data with error handling to prevent hanging
    this.loadCategories().catch(err => console.warn('Categories loading failed:', err));
    this.loadIngredients().catch(err => console.warn('Ingredients loading failed:', err));
    this.loadMenuItems().catch(err => console.warn('Menu items loading failed:', err));
  }

<<<<<<< Updated upstream
=======
  // Method to clear all cached data (useful for logout/user switching)
  clearCache(): void {
    this.menuItemsSubject.next([]);
    this.ingredientsSubject.next([]);
    this.categoriesSubject.next([]);
  }

  // Method to force reload all data (useful for user switching)
  forceReload(): void {
    this.clearCache();
    this.loadCategories().catch(err => console.warn('Categories loading failed:', err));
    this.loadIngredients().catch(err => console.warn('Ingredients loading failed:', err));
    this.loadMenuItems().catch(err => console.warn('Menu items loading failed:', err));
  }

>>>>>>> Stashed changes
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Format PHP currency
  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // MENU ITEMS
  async loadMenuItems(): Promise<void> {
    try {
      console.log('Loading menu items from API...');
      const response = await this.http.get<{ data: any[] }>(`${this.apiUrl}/menu-items`, {
        headers: this.getHeaders()
      }).toPromise();
      
      console.log('Raw API response:', response);
      console.log('Menu items from API:', response?.data);
      
      // Map backend field names to frontend field names
      const mappedItems: MenuItem[] = (response?.data || []).map(item => {
        console.log('Processing menu item:', item);
        console.log('Item ingredients:', item.ingredients);
        
        return {
          ...item,
          isAvailable: item.is_available !== undefined ? item.is_available : item.isAvailable,
          isPopular: item.is_popular !== undefined ? item.is_popular : item.isPopular,
          preparationTime: item.preparation_time !== undefined ? item.preparation_time : item.preparationTime,
          createdAt: item.created_at ? new Date(item.created_at) : item.createdAt,
          updatedAt: item.updated_at ? new Date(item.updated_at) : item.updatedAt
        };
      });
      
      console.log('Mapped menu items:', mappedItems);
      
      // Clear any existing items before setting new ones to prevent duplicates
      this.menuItemsSubject.next([]);
      
      // Set the new items
      this.menuItemsSubject.next(mappedItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  }

  async addMenuItem(menuItem: Partial<MenuItem>): Promise<string> {
    // Map frontend field names to backend field names
    const backendMenuItem: any = { ...menuItem };
    
    if ('isAvailable' in menuItem) {
      backendMenuItem.is_available = menuItem.isAvailable;
      delete backendMenuItem.isAvailable;
    }
    
    if ('isPopular' in menuItem) {
      backendMenuItem.is_popular = menuItem.isPopular;
      delete backendMenuItem.isPopular;
    }
    
    if ('preparationTime' in menuItem) {
      backendMenuItem.preparation_time = menuItem.preparationTime;
      delete backendMenuItem.preparationTime;
    }
    
    if ('createdAt' in menuItem) {
      backendMenuItem.created_at = menuItem.createdAt;
      delete backendMenuItem.createdAt;
    }
    
    if ('updatedAt' in menuItem) {
      backendMenuItem.updated_at = menuItem.updatedAt;
      delete backendMenuItem.updatedAt;
    }
    
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/menu-items`, backendMenuItem, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
    return response?.data.id || '';
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    // Map frontend field names to backend field names
    const backendUpdates: any = { ...updates };
    
    if ('isAvailable' in updates) {
      backendUpdates.is_available = updates.isAvailable;
      delete backendUpdates.isAvailable;
    }
    
    if ('updatedAt' in updates) {
      backendUpdates.updated_at = updates.updatedAt;
      delete backendUpdates.updatedAt;
    }
    
    if ('createdAt' in updates) {
      backendUpdates.created_at = updates.createdAt;
      delete backendUpdates.createdAt;
    }
    
    if ('preparationTime' in updates) {
      backendUpdates.preparation_time = updates.preparationTime;
      delete backendUpdates.preparationTime;
    }
    
    if ('isPopular' in updates) {
      backendUpdates.is_popular = updates.isPopular;
      delete backendUpdates.isPopular;
    }
    
    await this.http.put(`${this.apiUrl}/menu-items/${id}`, backendUpdates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/menu-items/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadMenuItems();
  }

  // INGREDIENTS
  async loadIngredients(): Promise<void> {
    try {
      const response = await this.http.get<{ data: Ingredient[] }>(`${this.apiUrl}/ingredients`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.ingredientsSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<string> {
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/ingredients`, ingredient, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
    return response?.data.id || '';
  }

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    await this.http.put(`${this.apiUrl}/ingredients/${id}`, updates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/ingredients/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadIngredients();
  }

  // CATEGORIES
  async loadCategories(): Promise<void> {
    try {
      const response = await this.http.get<{ data: MenuCategory[] }>(`${this.apiUrl}/menu-categories`, {
        headers: this.getHeaders()
      }).toPromise();
      
      this.categoriesSubject.next(response?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async addCategory(category: Omit<MenuCategory, 'id'>): Promise<string> {
    const response = await this.http.post<{ data: { id: string } }>(`${this.apiUrl}/menu-categories`, category, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
    return response?.data.id || '';
  }

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<void> {
    await this.http.put(`${this.apiUrl}/menu-categories/${id}`, updates, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
  }

  async deleteCategory(id: string): Promise<void> {
    await this.http.delete(`${this.apiUrl}/menu-categories/${id}`, {
      headers: this.getHeaders()
    }).toPromise();
    
    this.loadCategories();
  }

  // ORDERS
  // ANALYTICS
  async getDailySales(date: Date): Promise<DailySales> {
    const params = { date: date.toISOString().split('T')[0] };
    
    try {
      const response = await Promise.race([
        this.http.get<{ data: DailySales }>(`${this.apiUrl}/analytics/daily-sales`, {
          headers: this.getHeaders(),
          params
        }).toPromise(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Daily sales API timeout')), 5000)
        )
      ]);
      
      return response?.data || {
        date,
        totalSales: 0,
        popularItems: []
      };
    } catch (error) {
      console.warn('Failed to load daily sales, using default:', error);
      return {
        date,
        totalSales: 0,
        popularItems: []
      };
    }
  }

  // Get low stock ingredients
  getLowStockIngredients(): Observable<Ingredient[]> {
    return new Observable(observer => {
      this.ingredients$.subscribe(ingredients => {
        const lowStock = ingredients.filter(ing => ing.stock <= ing.minimumStock);
        observer.next(lowStock);
      });
    });
  }

  // Get detailed menu item information
  async getMenuItemDetails(id: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/menu-items/${id}`, {
        headers: this.getHeaders()
      }).toPromise();
      
      // The backend returns the menu item directly, not wrapped in data
      return response;
    } catch (error) {
      console.error('Error loading menu item details:', error);
      throw error;
    }
  }

  // Submit review for a menu item
  async submitReview(menuItemId: string, rating: number, review?: string): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/menu-items/${menuItemId}/reviews`, {
        rating,
        review: review || ''
      }, {
        headers: this.getHeaders()
      }).toPromise();
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Search menu items with filters
  async searchMenuItems(query: string, filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    calories?: number;
    allergens?: string[];
    dietary?: string[];
    karenderia?: string;
  }): Promise<any[]> {
    try {
      const params: any = { query };
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = (filters as any)[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params[key] = value.join(',');
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      const response = await this.http.get<{ data: any[] }>(`${this.apiUrl}/menu-items/search`, {
        headers: this.getHeaders(),
        params
      }).toPromise();
      
      return response?.data || [];
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw error;
    }
  }

  // Enhanced nutrition methods
  async getMenuItemWithNutrition(id: string): Promise<MenuItem & { nutrition?: MenuItemNutrition }> {
    try {
      const menuItem = await this.getMenuItemDetails(id);
      if (menuItem) {
        const ingredientNames = menuItem.ingredients?.map((ing: any) => 
          typeof ing === 'string' ? ing : ing.ingredientName || ing.name
        );
        const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
          menuItem.name, 
          ingredientNames
        );
        return { ...menuItem, nutrition };
      }
      throw new Error('Menu item not found');
    } catch (error) {
      console.error('Error getting menu item with nutrition:', error);
      throw error;
    }
  }

  async updateMenuItemNutrition(id: string, nutrition: MenuItemNutrition): Promise<void> {
    try {
      // Update nutrition in Laravel backend
      await this.http.put(`${this.apiUrl}/menu-items/${id}/nutrition`, {
        nutrition: nutrition.nutrition,
        allergens: nutrition.allergens,
        spice_level: nutrition.spiceLevel,
        dietary_tags: nutrition.dietaryTags,
        serving_size: nutrition.servingSize,
        calories: nutrition.nutrition.calories
      }, {
        headers: this.getHeaders()
      }).toPromise();

      this.loadMenuItems();
    } catch (error) {
      console.error('Error updating menu item nutrition:', error);
      throw error;
    }
  }

  async addMenuItemWithNutrition(menuItem: Partial<MenuItem>, autoGenerateNutrition: boolean = true): Promise<string> {
    try {
      // Add the menu item first
      const menuItemId = await this.addMenuItem(menuItem);

      // Generate nutrition data if requested
      if (autoGenerateNutrition && menuItem.name) {
        const ingredientNames = menuItem.ingredients?.map(ing => 
          typeof ing === 'string' ? ing : ing.ingredientName
        );
        
        const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
          menuItem.name,
          ingredientNames
        );

        if (nutrition) {
          await this.updateMenuItemNutrition(menuItemId, nutrition);
        }
      }

      return menuItemId;
    } catch (error) {
      console.error('Error adding menu item with nutrition:', error);
      throw error;
    }
  }

  async generateNutritionForExistingItems(): Promise<void> {
    try {
      const menuItems = this.menuItemsSubject.value;
      const promises = menuItems.map(async (item) => {
        if (item.id && item.name) {
          const ingredientNames = item.ingredients?.map(ing => 
            typeof ing === 'string' ? ing : ing.ingredientName
          );
          
          const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
            item.name,
            ingredientNames
          );

          if (nutrition) {
            await this.updateMenuItemNutrition(item.id, nutrition);
          }
        }
      });

      await Promise.all(promises);
      console.log('Nutrition data generated for all menu items');
    } catch (error) {
      console.error('Error generating nutrition for existing items:', error);
      throw error;
    }
  }

  async searchMenuItemsByNutrition(criteria: {
    maxCalories?: number;
    minProtein?: number;
    maxSodium?: number;
    allergenFree?: string[];
    spiceLevel?: string;
    dietaryTags?: string[];
  }): Promise<MenuItem[]> {
    try {
      const menuItems = this.menuItemsSubject.value;
      const filteredItems: MenuItem[] = [];

      for (const item of menuItems) {
        if (item.name) {
          const ingredientNames = item.ingredients?.map(ing => 
            typeof ing === 'string' ? ing : ing.ingredientName
          );
          
          const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
            item.name,
            ingredientNames
          );

          if (nutrition && this.matchesNutritionCriteria(nutrition, criteria)) {
            filteredItems.push(item);
          }
        }
      }

      return filteredItems;
    } catch (error) {
      console.error('Error searching menu items by nutrition:', error);
      return [];
    }
  }

  private matchesNutritionCriteria(nutrition: MenuItemNutrition, criteria: any): boolean {
    if (criteria.maxCalories && nutrition.nutrition.calories > criteria.maxCalories) return false;
    if (criteria.minProtein && nutrition.nutrition.protein < criteria.minProtein) return false;
    if (criteria.maxSodium && (nutrition.nutrition.sodium || 0) > criteria.maxSodium) return false;
    if (criteria.spiceLevel && nutrition.spiceLevel !== criteria.spiceLevel) return false;
    
    if (criteria.allergenFree && criteria.allergenFree.some((allergen: string) => 
      nutrition.allergens.includes(allergen))) return false;
    
    if (criteria.dietaryTags && !criteria.dietaryTags.every((tag: string) => 
      nutrition.dietaryTags.includes(tag))) return false;

    return true;
  }

  async checkAllergenCompatibility(menuItemId: string, userAllergens: string[]): Promise<{
    isSafe: boolean;
    warnings: string[];
    conflictingAllergens: string[];
  }> {
    try {
      const menuItem = await this.getMenuItemDetails(menuItemId);
      if (menuItem && menuItem.name) {
        const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
          menuItem.name,
          menuItem.ingredients
        );

        if (nutrition) {
          return this.enhancedNutritionService.checkAllergenCompatibility(nutrition, userAllergens);
        }
      }

      return { isSafe: true, warnings: [], conflictingAllergens: [] };
    } catch (error) {
      console.error('Error checking allergen compatibility:', error);
      return { isSafe: false, warnings: ['Unable to check allergen compatibility'], conflictingAllergens: [] };
    }
  }

  async getRecommendedMenuItems(userId: string, preferences?: {
    maxCalories?: number;
    preferredCuisines?: string[];
    dietaryRestrictions?: string[];
    allergens?: string[];
  }): Promise<MenuItem[]> {
    try {
      // Get user's allergen profile from backend
      const userAllergens = await this.getUserAllergens(userId);
      
      const menuItems = this.menuItemsSubject.value;
      const recommendations: MenuItem[] = [];

      for (const item of menuItems.slice(0, 20)) { // Limit to avoid too many API calls
        if (item.name) {
          const ingredientNames = item.ingredients?.map(ing => 
            typeof ing === 'string' ? ing : ing.ingredientName
          );
          
          const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
            item.name,
            ingredientNames
          );

          if (nutrition) {
            const allergenCheck = this.enhancedNutritionService.checkAllergenCompatibility(
              nutrition, 
              userAllergens.map(a => a.name)
            );

            if (allergenCheck.isSafe && this.matchesPreferences(nutrition, preferences)) {
              recommendations.push(item);
            }
          }
        }
      }

      // Sort by popularity and availability
      return recommendations.sort((a, b) => {
        const scoreA = (a.isPopular ? 1 : 0) * 0.7 + (a.isAvailable ? 1 : 0) * 0.3;
        const scoreB = (b.isPopular ? 1 : 0) * 0.7 + (b.isAvailable ? 1 : 0) * 0.3;
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('Error getting recommended menu items:', error);
      return [];
    }
  }

  private async getUserAllergens(userId: string): Promise<any[]> {
    try {
      const response = await this.http.get<{ data: any[] }>(`${this.apiUrl}/users/${userId}/allergens`, {
        headers: this.getHeaders()
      }).toPromise();
      
      return response?.data || [];
    } catch (error) {
      console.error('Error loading user allergens:', error);
      return [];
    }
  }

  private matchesPreferences(nutrition: MenuItemNutrition, preferences?: any): boolean {
    if (!preferences) return true;

    if (preferences.maxCalories && nutrition.nutrition.calories > preferences.maxCalories) return false;
    
    if (preferences.dietaryRestrictions && !preferences.dietaryRestrictions.every((restriction: string) => 
      nutrition.dietaryTags.includes(restriction))) return false;

    return true;
  }

  async syncWithSpoonacular(spoonacularRecipeId: number): Promise<MenuItem | null> {
    try {
      // Get recipe details from Spoonacular
      const recipe = await this.spoonacularService.getRecipeDetails(spoonacularRecipeId).toPromise();
      
      if (!recipe) {
        throw new Error('Recipe not found');
      }
      
      const spoonacularMenuItem = this.spoonacularService.convertRecipeToMenuItem(recipe);

      // Convert ingredients to MenuIngredient format
      const menuIngredients: MenuIngredient[] = spoonacularMenuItem.ingredients.map((ing, index) => ({
        ingredientId: `spoon_${index}`,
        ingredientName: typeof ing === 'string' ? ing : ing.name,
        quantity: 1,
        unit: 'serving',
        cost: 0
      }));

      // Convert to our MenuItem format
      const menuItem: Partial<MenuItem> = {
        name: spoonacularMenuItem.name,
        description: spoonacularMenuItem.description,
        price: spoonacularMenuItem.price,
        category: spoonacularMenuItem.category as any,
        ingredients: menuIngredients,
        allergens: spoonacularMenuItem.allergens,
        preparationTime: spoonacularMenuItem.preparationTime,
        nutritionalInfo: {
          calories: spoonacularMenuItem.nutritionalInfo.calories,
          protein: spoonacularMenuItem.nutritionalInfo.protein || 0,
          carbs: spoonacularMenuItem.nutritionalInfo.carbs || 0,
          fat: spoonacularMenuItem.nutritionalInfo.fat || 0
        },
        isAvailable: true
      };

      // Add to our system with nutrition data
      const menuItemId = await this.addMenuItemWithNutrition(menuItem, true);
      const addedItem = await this.getMenuItemDetails(menuItemId);
      
      return addedItem;
    } catch (error) {
      console.error('Error syncing with Spoonacular:', error);
      return null;
    }
  }

  // Get nutrition statistics for the menu
  async getMenuNutritionStats(): Promise<{
    averageCalories: number;
    totalItems: number;
    lowCalorieItems: number;
    highProteinItems: number;
    vegetarianItems: number;
    allergenFreeItems: number;
  }> {
    try {
      const menuItems = this.menuItemsSubject.value;
      let totalCalories = 0;
      let lowCalorieCount = 0;
      let highProteinCount = 0;
      let vegetarianCount = 0;
      let allergenFreeCount = 0;

      for (const item of menuItems) {
        if (item.name) {
          const ingredientNames = item.ingredients?.map(ing => 
            typeof ing === 'string' ? ing : ing.ingredientName
          );
          
          const nutrition = await this.enhancedNutritionService.getMenuItemNutrition(
            item.name,
            ingredientNames
          );

          if (nutrition) {
            totalCalories += nutrition.nutrition.calories;
            if (nutrition.nutrition.calories < 300) lowCalorieCount++;
            if (nutrition.nutrition.protein > 20) highProteinCount++;
            if (nutrition.dietaryTags.includes('vegetarian')) vegetarianCount++;
            if (nutrition.allergens.length === 0) allergenFreeCount++;
          }
        }
      }

      return {
        averageCalories: Math.round(totalCalories / menuItems.length),
        totalItems: menuItems.length,
        lowCalorieItems: lowCalorieCount,
        highProteinItems: highProteinCount,
        vegetarianItems: vegetarianCount,
        allergenFreeItems: allergenFreeCount
      };
    } catch (error) {
      console.error('Error getting menu nutrition stats:', error);
      return {
        averageCalories: 0,
        totalItems: 0,
        lowCalorieItems: 0,
        highProteinItems: 0,
        vegetarianItems: 0,
        allergenFreeItems: 0
      };
    }
  }
}
