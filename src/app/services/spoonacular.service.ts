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
    fiber?: number;
    sodium?: number;
    sugar?: number;
  };
  spiceLevel?: 'mild' | 'medium' | 'spicy' | 'very_spicy';
  dietaryTags?: string[];
  servingSize?: string;
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
        fat: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0),
        fiber: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Fiber')?.amount || 0),
        sodium: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Sodium')?.amount || 0),
        sugar: Math.round(recipe.nutrition?.nutrients?.find(n => n.name === 'Sugar')?.amount || 0)
      },
      spiceLevel: this.determineSpiceLevel(recipe),
      dietaryTags: this.extractDietaryTags(recipe),
      servingSize: recipe.servings ? `${recipe.servings} serving${recipe.servings !== 1 ? 's' : ''}` : '1 serving',
      searchCount: 1,
      addedAt: new Date(),
      spoonacularId: recipe.id
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
    
    // Check ingredients for common allergens including Filipino terms
    recipe.extendedIngredients?.forEach(ing => {
      const name = ing.name.toLowerCase();
      
      // Peanuts (including Filipino terms)
      if (name.includes('peanut') || name.includes('mani') || name.includes('kare-kare')) {
        allergens.push('peanuts');
      }
      
      // Tree nuts
      if (name.includes('tree nut') || name.includes('almond') || name.includes('walnut') || 
          name.includes('cashew') || name.includes('coconut')) {
        allergens.push('tree nuts');
      }
      
      // Shellfish (including Filipino terms)
      if (name.includes('shellfish') || name.includes('shrimp') || name.includes('crab') ||
          name.includes('hipon') || name.includes('alimango') || name.includes('talaba') ||
          name.includes('sugpo') || name.includes('bagoong')) {
        allergens.push('shellfish');
      }
      
      // Fish (including Filipino terms)
      if ((name.includes('fish') && !name.includes('shellfish')) || 
          name.includes('isda') || name.includes('bangus') || name.includes('tilapia') ||
          name.includes('patis') || name.includes('fish sauce')) {
        allergens.push('fish');
      }
      
      // Eggs (including Filipino terms)
      if (name.includes('egg') || name.includes('itlog') || name.includes('balut')) {
        allergens.push('eggs');
      }
      
      // Soy (including Filipino terms)
      if (name.includes('soy') || name.includes('tofu') || name.includes('tokwa') ||
          name.includes('taho') || name.includes('toyo') || name.includes('soy sauce')) {
        allergens.push('soy');
      }
      
      // Dairy (including Filipino terms)
      if (name.includes('milk') || name.includes('cheese') || name.includes('butter') ||
          name.includes('gatas') || name.includes('keso') || name.includes('mantikilya') ||
          name.includes('kesong puti')) {
        allergens.push('dairy');
      }
      
      // Wheat (including Filipino terms)
      if (name.includes('wheat') || name.includes('flour') || name.includes('bread') ||
          name.includes('harina') || name.includes('tinapay')) {
        allergens.push('wheat');
      }
      
      // Sesame
      if (name.includes('sesame') || name.includes('linga')) {
        allergens.push('sesame');
      }
    });
    
    return [...new Set(allergens)];
  }

  private determineSpiceLevel(recipe: SpoonacularRecipe): 'mild' | 'medium' | 'spicy' | 'very_spicy' {
    const title = recipe.title.toLowerCase();
    const summary = recipe.summary?.toLowerCase() || '';
    
    // Check for spice indicators in title and summary
    if (title.includes('very spicy') || title.includes('extra hot') || summary.includes('very spicy')) {
      return 'very_spicy';
    } else if (title.includes('spicy') || title.includes('hot') || title.includes('chili') || summary.includes('spicy')) {
      return 'spicy';
    } else if (title.includes('mild spice') || summary.includes('mild spice')) {
      return 'medium';
    }
    
    // Check ingredients for spicy elements
    const spicyIngredients = recipe.extendedIngredients?.some(ing => {
      const name = ing.name.toLowerCase();
      return name.includes('chili') || name.includes('pepper') || name.includes('hot sauce') || 
             name.includes('cayenne') || name.includes('jalapeño') || name.includes('habanero');
    });
    
    return spicyIngredients ? 'medium' : 'mild';
  }

  private extractDietaryTags(recipe: SpoonacularRecipe): string[] {
    const tags: string[] = [];
    
    if (recipe.vegetarian) tags.push('vegetarian');
    if (recipe.vegan) tags.push('vegan');
    if (recipe.glutenFree) tags.push('gluten-free');
    if (recipe.dairyFree) tags.push('dairy-free');
    if (recipe.veryHealthy) tags.push('healthy');
    if (recipe.cheap) tags.push('budget-friendly');
    if (recipe.ketogenic) tags.push('keto');
    if (recipe.whole30) tags.push('whole30');
    if (recipe.lowFodmap) tags.push('low-fodmap');
    
    // Add cuisine tags
    if (recipe.cuisines && recipe.cuisines.length > 0) {
      recipe.cuisines.forEach(cuisine => {
        tags.push(cuisine.toLowerCase());
      });
    }
    
    return tags;
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

  /**
   * Get comprehensive meal analysis including nutrition, allergens, and calories
   */
  getMealAnalysisWithAllergens(recipeId: number, userAllergens: string[] = []): Observable<{
    recipe: SpoonacularRecipe;
    nutrition: SpoonacularNutrition;
    allergenWarnings: string[];
    safetyLevel: 'safe' | 'caution' | 'danger';
    recommendations: string[];
  }> {
    return forkJoin({
      recipe: this.getRecipeDetails(recipeId),
      nutrition: this.getRecipeNutrition(recipeId)
    }).pipe(
      map(({ recipe, nutrition }) => {
        // Extract allergens from recipe
        const recipeAllergens = this.extractAllergens(recipe);
        
        // Find matching allergens with user's allergens
        const allergenWarnings = userAllergens.filter(userAllergen => 
          recipeAllergens.some(recipeAllergen => 
            recipeAllergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
            userAllergen.toLowerCase().includes(recipeAllergen.toLowerCase())
          )
        );
        
        // Determine safety level
        let safetyLevel: 'safe' | 'caution' | 'danger' = 'safe';
        if (allergenWarnings.length > 0) {
          safetyLevel = 'danger';
        } else if (recipeAllergens.length > 0 && userAllergens.length > 0) {
          safetyLevel = 'caution';
        }
        
        // Generate recommendations
        const recommendations: string[] = [];
        if (allergenWarnings.length > 0) {
          recommendations.push(`⚠️ Contains allergens: ${allergenWarnings.join(', ')}`);
          recommendations.push('🚫 Not recommended for consumption');
          recommendations.push('💡 Consider asking for ingredient substitutions');
        } else if (safetyLevel === 'caution') {
          recommendations.push('⚠️ Contains other allergens, but none that match your profile');
          recommendations.push('✅ Should be safe for you to consume');
        } else {
          recommendations.push('✅ No known allergens detected');
          recommendations.push('🟢 Safe for your allergen profile');
        }
        
        return {
          recipe,
          nutrition,
          allergenWarnings,
          safetyLevel,
          recommendations
        };
      }),
      catchError(error => {
        console.error('Error getting meal analysis:', error);
        throw error;
      })
    );
  }

  /**
   * Search for Filipino recipes with allergen filtering
   */
  searchFilipinoRecipesWithAllergens(query: string = '', userAllergens: string[] = []): Observable<SpoonacularMenuItem[]> {
    const filipinoQuery = query ? `${query} filipino` : 'adobo sisig kare-kare lumpia lechon';
    
    // Convert user allergens to Spoonacular intolerances format
    const intolerances = userAllergens.map(allergen => {
      switch (allergen.toLowerCase()) {
        case 'dairy': return 'dairy';
        case 'eggs': return 'egg';
        case 'fish': return 'seafood';
        case 'shellfish': return 'shellfish';
        case 'tree nuts': return 'tree nut';
        case 'peanuts': return 'peanut';
        case 'soy': return 'soy';
        case 'wheat': return 'gluten';
        case 'sesame': return 'sesame';
        default: return allergen;
      }
    }).join(',');
    
    return this.searchRecipes(filipinoQuery, 'asian', undefined, intolerances, 20).pipe(
      map(response => response.results.map(recipe => this.convertRecipeToMenuItem(recipe)))
    );
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
