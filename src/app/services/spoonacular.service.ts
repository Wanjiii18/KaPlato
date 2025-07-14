import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, from, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

// Spoonacular API interfaces
export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  aggregateLikes: number;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  analyzedInstructions: any[];
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  extendedIngredients: SpoonacularIngredient[];
  summary: string;
  winePairing: any;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

export interface SpoonacularIngredient {
  id: number;
  aisle: string;
  image: string;
  consistency: string;
  name: string;
  nameClean: string;
  original: string;
  originalString: string;
  originalName: string;
  amount: number;
  unit: string;
  meta: string[];
  metaInformation: string[];
  measures: {
    us: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
    metric: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
  };
}

export interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface SpoonacularMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  ingredients: SpoonacularMenuIngredient[];
  preparationTime: number;
  isAvailable: boolean;
  isPopular: boolean;
  allergens: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  searchCount?: number;
  addedAt?: Date;
  spoonacularId?: number;
}

export interface SpoonacularMenuIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  image?: string;
  estimatedCost?: number;
  cost?: number;
  aisle?: string;
  consistency?: string;
}

export interface SpoonacularNutrition {
  calories: number;
  carbs: string;
  fat: string;
  protein: string;
  bad: Array<{
    name: string;
    amount: string;
    indented: boolean;
    percentOfDailyNeeds: number;
  }>;
  good: Array<{
    name: string;
    amount: string;
    indented: boolean;
    percentOfDailyNeeds: number;
  }>;
  nutrients: Array<{
    name: string;
    amount: number;
    unit: string;
    percentOfDailyNeeds: number;
  }>;
}

// Local storage keys for caching
const CACHE_KEYS = {
  INGREDIENTS: 'spoonacular_ingredients_cache',
  MENU_ITEMS: 'spoonacular_menu_items_cache',
  RECIPES: 'spoonacular_recipes_cache',
  SEARCH_HISTORY: 'spoonacular_search_history'
};

@Injectable({
  providedIn: 'root'
})
export class SpoonacularService {
  private baseUrl = environment.spoonacular.baseUrl;
  private apiKey = environment.spoonacular.apiKey;

  // BehaviorSubjects for reactive data
  private ingredientsSubject = new BehaviorSubject<SpoonacularMenuIngredient[]>([]);
  private menuItemsSubject = new BehaviorSubject<SpoonacularMenuItem[]>([]);
  private popularRecipesSubject = new BehaviorSubject<SpoonacularRecipe[]>([]);

  public ingredients$ = this.ingredientsSubject.asObservable();
  public menuItems$ = this.menuItemsSubject.asObservable();
  public popularRecipes$ = this.popularRecipesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCachedData();
  }

  // Cache management methods using localStorage
  private loadCachedData(): void {
    try {
      const cachedIngredients = localStorage.getItem(CACHE_KEYS.INGREDIENTS);
      if (cachedIngredients) {
        this.ingredientsSubject.next(JSON.parse(cachedIngredients));
      }

      const cachedMenuItems = localStorage.getItem(CACHE_KEYS.MENU_ITEMS);
      if (cachedMenuItems) {
        this.menuItemsSubject.next(JSON.parse(cachedMenuItems));
      }

      const cachedRecipes = localStorage.getItem(CACHE_KEYS.RECIPES);
      if (cachedRecipes) {
        this.popularRecipesSubject.next(JSON.parse(cachedRecipes));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  private cacheData(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Recipe search methods
  searchRecipes(query: string, cuisine?: string, diet?: string, intolerances?: string, number: number = 12): Observable<SpoonacularSearchResponse> {
    let params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('query', query)
      .set('number', number.toString())
      .set('addRecipeInformation', 'true')
      .set('fillIngredients', 'true');

    if (cuisine) {
      params = params.set('cuisine', cuisine);
    }
    if (diet) {
      params = params.set('diet', diet);
    }
    if (intolerances) {
      params = params.set('intolerances', intolerances);
    }

    return this.http.get<SpoonacularSearchResponse>(`${this.baseUrl}/recipes/complexSearch`, { params })
      .pipe(
        tap(response => {
          // Cache popular recipes
          if (response.results.length > 0) {
            this.cacheData(CACHE_KEYS.RECIPES, response.results);
            this.popularRecipesSubject.next(response.results);
          }
        }),
        catchError(error => {
          console.error('Error searching recipes:', error);
          return of({ results: [], offset: 0, number: 0, totalResults: 0 });
        })
      );
  }

  getRecipeDetails(id: number): Observable<SpoonacularRecipe> {
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('includeNutrition', 'true');

    return this.http.get<SpoonacularRecipe>(`${this.baseUrl}/recipes/${id}/information`, { params })
      .pipe(
        catchError(error => {
          console.error('Error getting recipe details:', error);
          throw error;
        })
      );
  }

  getRecipeNutrition(id: number): Observable<SpoonacularNutrition> {
    const params = new HttpParams().set('apiKey', this.apiKey);

    return this.http.get<SpoonacularNutrition>(`${this.baseUrl}/recipes/${id}/nutritionWidget.json`, { params })
      .pipe(
        catchError(error => {
          console.error('Error getting recipe nutrition:', error);
          throw error;
        })
      );
  }

  // Ingredient search methods
  searchIngredients(query: string, number: number = 12): Observable<SpoonacularMenuIngredient[]> {
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('query', query)
      .set('number', number.toString())
      .set('metaInformation', 'true');

    return this.http.get<any[]>(`${this.baseUrl}/food/ingredients/search`, { params })
      .pipe(
        map(ingredients => ingredients.map(ingredient => ({
          id: ingredient.id.toString(),
          name: ingredient.name,
          amount: 1,
          unit: 'unit',
          image: ingredient.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}` : undefined
        }))),
        tap(ingredients => {
          // Update cache
          const currentIngredients = this.ingredientsSubject.value;
          const updatedIngredients = [...currentIngredients, ...ingredients];
          this.cacheData(CACHE_KEYS.INGREDIENTS, updatedIngredients);
          this.ingredientsSubject.next(updatedIngredients);
        }),
        catchError(error => {
          console.error('Error searching ingredients:', error);
          return of([]);
        })
      );
  }

  // Recipe-to-menu item conversion
  convertRecipeToMenuItem(recipe: SpoonacularRecipe): SpoonacularMenuItem {
    const estimatedPrice = this.estimateRecipePrice(recipe);
    
    return {
      id: `spoon_${recipe.id}`,
      name: recipe.title,
      description: this.stripHtml(recipe.summary).substring(0, 200) + '...',
      price: estimatedPrice,
      category: recipe.dishTypes?.[0] || 'main course',
      image: recipe.image,
      ingredients: recipe.extendedIngredients?.map(ing => ({
        id: ing.id.toString(),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        image: ing.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}` : undefined
      })) || [],
      preparationTime: recipe.readyInMinutes || 30,
      isAvailable: true,
      isPopular: recipe.veryPopular || recipe.aggregateLikes > 100,
      allergens: this.extractAllergens(recipe),
      nutritionalInfo: {
        calories: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0),
        protein: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0),
        carbs: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0),
        fat: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0)
      },
      searchCount: 1,
      addedAt: new Date()
    };
  }

  // Helper methods
  private estimateRecipePrice(recipe: SpoonacularRecipe): number {
    if (recipe.pricePerServing) {
      return Math.round(recipe.pricePerServing / 100 * recipe.servings);
    }
    
    // Fallback estimation based on ingredients count and complexity
    const basePrice = 5;
    const ingredientCount = recipe.extendedIngredients?.length || 5;
    const complexityMultiplier = recipe.readyInMinutes > 60 ? 1.5 : 1;
    
    return Math.round((basePrice + ingredientCount * 0.5) * complexityMultiplier);
  }

  private extractAllergens(recipe: SpoonacularRecipe): string[] {
    const allergens: string[] = [];
    
    if (!recipe.dairyFree) allergens.push('dairy');
    if (!recipe.glutenFree) allergens.push('gluten');
    if (!recipe.vegan) allergens.push('animal products');
    
    // Check ingredients for common allergens
    recipe.extendedIngredients?.forEach(ing => {
      const name = ing.name.toLowerCase();
      if (name.includes('peanut')) allergens.push('peanuts');
      if (name.includes('tree nut') || name.includes('almond') || name.includes('walnut')) {
        allergens.push('tree nuts');
      }
      if (name.includes('shellfish') || name.includes('shrimp') || name.includes('crab')) {
        allergens.push('shellfish');
      }
      if (name.includes('fish') && !name.includes('shellfish')) allergens.push('fish');
      if (name.includes('egg')) allergens.push('eggs');
      if (name.includes('soy')) allergens.push('soy');
      if (name.includes('sesame')) allergens.push('sesame');
    });
    
    return [...new Set(allergens)];
  }

  private stripHtml(text: string): string {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  // Menu item management
  addMenuItem(recipe: SpoonacularRecipe): Observable<SpoonacularMenuItem> {
    const menuItem = this.convertRecipeToMenuItem(recipe);
    
    return new Observable(observer => {
      try {
        const currentItems = this.menuItemsSubject.value;
        const existingIndex = currentItems.findIndex(item => item.id === menuItem.id);
        
        if (existingIndex >= 0) {
          // Update existing item
          currentItems[existingIndex] = {
            ...currentItems[existingIndex],
            searchCount: (currentItems[existingIndex].searchCount || 0) + 1
          };
        } else {
          // Add new item
          currentItems.push(menuItem);
        }
        
        this.cacheData(CACHE_KEYS.MENU_ITEMS, currentItems);
        this.menuItemsSubject.next(currentItems);
        
        observer.next(menuItem);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // Get popular recipes from cache or API
  getPopularRecipes(limit: number = 12): Observable<SpoonacularRecipe[]> {
    const cached = this.popularRecipesSubject.value;
    if (cached.length >= limit) {
      return of(cached.slice(0, limit));
    }

    return this.searchRecipes('popular', undefined, undefined, undefined, limit)
      .pipe(map(response => response.results));
  }

  // Get random recipes
  getRandomRecipes(number: number = 12, tags?: string): Observable<{ recipes: SpoonacularRecipe[] }> {
    let params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('number', number.toString())
      .set('include-tags', tags || '');

    return this.http.get<{ recipes: SpoonacularRecipe[] }>(`${this.baseUrl}/recipes/random`, { params })
      .pipe(
        catchError(error => {
          console.error('Error getting random recipes:', error);
          return of({ recipes: [] });
        })
      );
  }

  // Meal planning
  generateMealPlan(timeFrame: 'day' | 'week', targetCalories?: number, diet?: string): Observable<any> {
    let params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('timeFrame', timeFrame);

    if (targetCalories) {
      params = params.set('targetCalories', targetCalories.toString());
    }
    if (diet) {
      params = params.set('diet', diet);
    }

    return this.http.get(`${this.baseUrl}/mealplanner/generate`, { params })
      .pipe(
        catchError(error => {
          console.error('Error generating meal plan:', error);
          throw error;
        })
      );
  }

  // Search history management
  addToSearchHistory(query: string): void {
    try {
      const history = JSON.parse(localStorage.getItem(CACHE_KEYS.SEARCH_HISTORY) || '[]');
      const filteredHistory = history.filter((item: any) => item.query !== query);
      
      filteredHistory.unshift({
        query: query,
        timestamp: new Date().toISOString()
      });

      // Keep only last 20 searches
      const limitedHistory = filteredHistory.slice(0, 20);
      localStorage.setItem(CACHE_KEYS.SEARCH_HISTORY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }

  getSearchHistory(): string[] {
    try {
      const history = JSON.parse(localStorage.getItem(CACHE_KEYS.SEARCH_HISTORY) || '[]');
      return history.map((item: any) => item.query);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  clearCache(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    this.ingredientsSubject.next([]);
    this.menuItemsSubject.next([]);
    this.popularRecipesSubject.next([]);
  }

  // Auto-complete for search
  getAutocompleteSuggestions(query: string): Observable<string[]> {
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('query', query)
      .set('number', '5');

    return this.http.get<any[]>(`${this.baseUrl}/recipes/autocomplete`, { params })
      .pipe(
        map(suggestions => suggestions.map(s => s.title)),
        catchError(error => {
          console.error('Error getting autocomplete suggestions:', error);
          return of([]);
        })
      );
  }

  // Missing methods referenced in other components
  getPopularIngredients(limit: number = 12): Observable<SpoonacularMenuIngredient[]> {
    // Return cached ingredients or search for popular ones
    const cached = this.ingredientsSubject.value;
    if (cached.length >= limit) {
      return of(cached.slice(0, limit));
    }
    
    // Fallback to search common ingredients
    return this.searchIngredients('chicken,rice,garlic,onion,tomato', limit);
  }

  testApi(): Observable<any> {
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('query', 'test')
      .set('number', '1');

    return this.http.get(`${this.baseUrl}/recipes/complexSearch`, { params });
  }

  testApiConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    return this.testApi().toPromise().then(
      (result) => ({
        success: true,
        message: 'API connection successful',
        data: result
      })
    ).catch(
      (error) => ({
        success: false,
        message: `API connection failed: ${error.message || 'Unknown error'}`
      })
    );
  }

  searchIngredientsHybrid(query: string, limit: number = 12): Observable<{ ingredients: SpoonacularMenuIngredient[], fromFirestore: boolean }> {
    // Since we removed Firebase, just use regular search
    return this.searchIngredients(query, limit).pipe(
      map(ingredients => ({ ingredients, fromFirestore: false }))
    );
  }

  addIngredientToDatabase(ingredient: any): Promise<void> {
    // Since we removed Firebase, this is now a no-op or could save to localStorage
    return Promise.resolve();
  }

  loadPopularMenu(): Promise<void> {
    return this.getPopularRecipes(12).toPromise().then(() => {
      // Menu loaded
    });
  }

  searchByCategory(category: string): Promise<SpoonacularMenuItem[]> {
    return this.searchRecipes(category, undefined, undefined, undefined, 12).toPromise().then(
      response => response ? response.results.map(recipe => this.convertRecipeToMenuItem(recipe)) : []
    );
  }
}
