import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, from, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

// Firebase imports
import { Firestore, collection, doc, getDoc, getDocs, setDoc, addDoc, query as firestoreQuery, where, orderBy, limit as firestoreLimit, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

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

// Our app's menu item interface adapted for Spoonacular
export interface SpoonacularMenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // We'll calculate this based on ingredients
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
  spoonacularId: number;
  servings: number;
  healthScore: number;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
}

export interface SpoonacularMenuIngredient {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number; // Estimated cost
  aisle: string;
}

// Firestore interfaces for cached data
export interface FirestoreIngredient {
  id: string;
  spoonacularId: number;
  name: string;
  nameClean?: string;
  image: string;
  aisle: string;
  consistency?: string;
  original?: string;
  unit?: string;
  amount?: number;
  measures?: any;
  addedAt: any; // Firestore timestamp
  searchCount: number; // How many times this ingredient was searched
  isPopular: boolean;
  addedBy?: string; // User ID who added it
}

export interface FirestoreMenuItem {
  id: string;
  spoonacularId?: number;
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
  servings: number;
  healthScore: number;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  addedAt: any; // Firestore timestamp
  searchCount: number;
  addedBy?: string; // User ID who added it
}

@Injectable({
  providedIn: 'root'
})
export class SpoonacularService {
  private readonly API_KEY = environment.spoonacular.apiKey;
  private readonly BASE_URL = environment.spoonacular.baseUrl;
  private firestore = inject(Firestore);
  
  private menuItemsSubject = new BehaviorSubject<SpoonacularMenuItem[]>([]);
  public menuItems$ = this.menuItemsSubject.asObservable();

  // Firestore collections
  private ingredientsCollection = collection(this.firestore, 'ingredients');
  private menuItemsCollection = collection(this.firestore, 'menuItems');

  // Estimated ingredient costs (per 100g/100ml) in PHP
  private ingredientCostMap: { [key: string]: number } = {
    // Proteins
    'chicken': 250,
    'beef': 400,
    'pork': 300,
    'fish': 350,
    'eggs': 8,
    'tofu': 150,
    
    // Vegetables
    'onion': 80,
    'garlic': 200,
    'tomato': 100,
    'potato': 60,
    'carrot': 120,
    'bell pepper': 180,
    'spinach': 150,
    'lettuce': 120,
    
    // Grains & Starches
    'rice': 50,
    'pasta': 80,
    'bread': 100,
    'flour': 40,
    
    // Dairy
    'milk': 70,
    'cheese': 300,
    'butter': 350,
    'cream': 200,
    
    // Seasonings & Others
    'salt': 20,
    'pepper': 500,
    'oil': 150,
    'sugar': 60,
    'soy sauce': 100,
    'vinegar': 80
  };

  constructor(private http: HttpClient) {}

  /**
   * Search for recipes by query
   */
  searchRecipes(query: string, cuisine?: string, diet?: string, number: number = 12): Observable<SpoonacularMenuItem[]> {
    let params = new HttpParams()
      .set('apiKey', this.API_KEY)
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

    return this.http.get<SpoonacularSearchResponse>(`${this.BASE_URL}/recipes/complexSearch`, { params })
      .pipe(
        map(response => this.convertToMenuItems(response.results)),
        catchError(error => {
          console.error('Error searching recipes:', error);
          return of([]);
        })
      );
  }

  /**
   * Get random recipes by category
   */
  getRandomRecipes(tags?: string, number: number = 10): Observable<SpoonacularMenuItem[]> {
    let params = new HttpParams()
      .set('apiKey', this.API_KEY)
      .set('number', number.toString());

    if (tags) {
      params = params.set('tags', tags);
    }

    return this.http.get<{ recipes: SpoonacularRecipe[] }>(`${this.BASE_URL}/recipes/random`, { params })
      .pipe(
        map(response => this.convertToMenuItems(response.recipes)),
        catchError(error => {
          console.error('Error getting random recipes:', error);
          return of([]);
        })
      );
  }

  /**
   * Get recipe by ID with full details
   */
  getRecipeById(id: number): Observable<SpoonacularMenuItem | null> {
    const params = new HttpParams()
      .set('apiKey', this.API_KEY)
      .set('includeNutrition', 'true');

    return this.http.get<SpoonacularRecipe>(`${this.BASE_URL}/recipes/${id}/information`, { params })
      .pipe(
        map(recipe => this.convertToMenuItem(recipe)),
        catchError(error => {
          console.error('Error getting recipe by ID:', error);
          return of(null);
        })
      );
  }

  /**
   * Load popular recipes for our menu
   */
  async loadPopularMenu(): Promise<void> {
    try {
      // Get a mix of popular recipes from different categories
      const categories = [
        'main course,dinner',
        'breakfast',
        'lunch', 
        'appetizer',
        'dessert',
        'drink'
      ];

      const allMenuItems: SpoonacularMenuItem[] = [];

      for (const category of categories) {
        const items = await this.getRandomRecipes(category, 5).toPromise();
        if (items) {
          allMenuItems.push(...items);
        }
      }

      this.menuItemsSubject.next(allMenuItems);
    } catch (error) {
      console.error('Error loading popular menu:', error);
    }
  }

  /**
   * Convert Spoonacular recipes to our menu item format
   */
  private convertToMenuItems(recipes: SpoonacularRecipe[]): SpoonacularMenuItem[] {
    return recipes.map(recipe => this.convertToMenuItem(recipe));
  }

  /**
   * Convert single Spoonacular recipe to our menu item format
   */
  private convertToMenuItem(recipe: SpoonacularRecipe): SpoonacularMenuItem {
    const ingredients = this.convertIngredients(recipe.extendedIngredients || []);
    const estimatedCost = this.calculateEstimatedCost(ingredients);
    
    // Price markup: Cost + 200-300% profit margin
    const price = Math.round(estimatedCost * 2.5);

    return {
      id: `spoon_${recipe.id}`,
      name: recipe.title,
      description: this.cleanSummary(recipe.summary || ''),
      price: price,
      category: this.getCategoryFromDishTypes(recipe.dishTypes || []),
      image: recipe.image,
      ingredients: ingredients,
      preparationTime: recipe.readyInMinutes || 30,
      isAvailable: true,
      isPopular: recipe.veryPopular || recipe.aggregateLikes > 100,
      allergens: this.extractAllergens(recipe),
      nutritionalInfo: {
        calories: 0, // Would need separate nutrition API call
        protein: 0,
        carbs: 0,
        fat: 0
      },
      spoonacularId: recipe.id,
      servings: recipe.servings || 1,
      healthScore: recipe.healthScore || 0,
      vegan: recipe.vegan || false,
      vegetarian: recipe.vegetarian || false,
      glutenFree: recipe.glutenFree || false,
      dairyFree: recipe.dairyFree || false
    };
  }

  /**
   * Convert Spoonacular ingredients to our format
   */
  private convertIngredients(spoonIngredients: SpoonacularIngredient[]): SpoonacularMenuIngredient[] {
    return spoonIngredients.map(ingredient => {
      const cost = this.estimateIngredientCost(ingredient);
      
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.nameClean || ingredient.name,
        quantity: ingredient.measures.metric.amount,
        unit: ingredient.measures.metric.unitShort,
        cost: cost,
        aisle: ingredient.aisle
      };
    });
  }

  /**
   * Estimate ingredient cost based on name and quantity
   */
  private estimateIngredientCost(ingredient: SpoonacularIngredient): number {
    const name = (ingredient.nameClean || ingredient.name).toLowerCase();
    const amount = ingredient.measures.metric.amount;
    
    // Try to find matching cost in our cost map
    let costPer100g = 100; // Default cost if not found
    
    for (const [key, cost] of Object.entries(this.ingredientCostMap)) {
      if (name.includes(key)) {
        costPer100g = cost;
        break;
      }
    }
    
    // Calculate cost based on amount (assuming most ingredients are measured per 100g)
    const ratio = amount / 100;
    return Math.max(1, Math.round(costPer100g * ratio));
  }

  /**
   * Calculate total estimated cost for a recipe
   */
  private calculateEstimatedCost(ingredients: SpoonacularMenuIngredient[]): number {
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  }

  /**
   * Get category from Spoonacular dish types
   */
  private getCategoryFromDishTypes(dishTypes: string[]): string {
    if (dishTypes.includes('main course') || dishTypes.includes('main dish')) {
      return 'main dish';
    }
    if (dishTypes.includes('breakfast')) {
      return 'breakfast';
    }
    if (dishTypes.includes('dessert')) {
      return 'dessert';
    }
    if (dishTypes.includes('appetizer') || dishTypes.includes('starter')) {
      return 'appetizer';
    }
    if (dishTypes.includes('beverage') || dishTypes.includes('drink')) {
      return 'drinks';
    }
    if (dishTypes.includes('side dish')) {
      return 'side dish';
    }
    
    return 'main dish'; // Default category
  }

  /**
   * Extract allergens from recipe
   */
  private extractAllergens(recipe: SpoonacularRecipe): string[] {
    const allergens: string[] = [];
    
    if (!recipe.glutenFree) allergens.push('gluten');
    if (!recipe.dairyFree) allergens.push('dairy');
    if (!recipe.vegan) allergens.push('animal products');
    
    return allergens;
  }

  /**
   * Clean HTML from summary
   */
  private cleanSummary(summary: string): string {
    return summary
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .substring(0, 150) + '...'; // Limit length
  }

  /**
   * Get current menu items
   */
  getCurrentMenuItems(): SpoonacularMenuItem[] {
    return this.menuItemsSubject.value;
  }

  /**
   * Search by category
   */
  async searchByCategory(category: string): Promise<SpoonacularMenuItem[]> {
    const categoryMap: { [key: string]: string } = {
      'breakfast': 'breakfast',
      'main dish': 'main course,dinner',
      'appetizer': 'appetizer,starter',
      'dessert': 'dessert',
      'drinks': 'beverage,drink',
      'side dish': 'side dish'
    };

    const tags = categoryMap[category] || category;
    const items = await this.getRandomRecipes(tags, 10).toPromise();
    return items || [];
  }

  /**
   * Format price in PHP
   */
  formatPhp(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Test API connection with a simple request
   */
  async testApiConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Testing Spoonacular API connection...');
      console.log('API Key:', this.API_KEY ? 'Set' : 'Not set');
      console.log('Base URL:', this.BASE_URL);

      // Simple test request - get a random recipe
      const params = new HttpParams()
        .set('apiKey', this.API_KEY)
        .set('number', '1');

      const response = await this.http.get<{ recipes: SpoonacularRecipe[] }>(`${this.BASE_URL}/recipes/random`, { params }).toPromise();
      
      if (response && response.recipes && response.recipes.length > 0) {
        const recipe = response.recipes[0];
        console.log('✅ API Test Successful! Retrieved recipe:', recipe.title);
        return {
          success: true,
          message: `API connected successfully! Retrieved recipe: "${recipe.title}"`,
          data: recipe
        };
      } else {
        console.log('❌ API Test Failed: No recipes returned');
        return {
          success: false,
          message: 'API connected but no recipes returned'
        };
      }
    } catch (error: any) {
      console.error('❌ API Test Failed:', error);
      
      if (error.status === 401) {
        return {
          success: false,
          message: 'API Key is invalid or missing. Please check your environment configuration.'
        };
      } else if (error.status === 402) {
        return {
          success: false,
          message: 'API quota exceeded. Please check your Spoonacular plan.'
        };
      } else if (error.status === 0) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection.'
        };
      } else {
        return {
          success: false,
          message: `API Error: ${error.message || 'Unknown error occurred'}`
        };
      }
    }
  }

  /**
   * Test API with a specific request
   */
  testApi(): Observable<any> {
    const params = new HttpParams().set('apiKey', this.API_KEY).set('query', 'pizza');
    return this.http.get(`${this.BASE_URL}/recipes/complexSearch`, { params });
  }

  /**
   * Search for ingredients by name
   */
  searchIngredients(query: string, number: number = 10): Observable<SpoonacularIngredient[]> {
    let params = new HttpParams()
      .set('apiKey', this.API_KEY)
      .set('query', query)
      .set('number', number.toString());
    return this.http.get<{ results: SpoonacularIngredient[] }>(`${this.BASE_URL}/food/ingredients/search`, { params })
      .pipe(
        map(res => res.results),
        catchError(error => {
          console.error('Error searching ingredients:', error);
          return of([]);
        })
      );
  }

  /**
   * HYBRID SEARCH: Search ingredients in Firestore first, then API as fallback
   */
  searchIngredientsHybrid(query: string, number: number = 10): Observable<{ ingredients: SpoonacularIngredient[], fromFirestore: boolean }> {
    console.log(`🔍 Hybrid search for ingredients: "${query}"`);
    
    // First, search in Firestore
    return this.searchIngredientsFromFirestore(query, number).pipe(
      switchMap(firestoreResults => {
        if (firestoreResults.length > 0) {
          console.log(`✅ Found ${firestoreResults.length} ingredients in Firestore cache`);
          return of({ 
            ingredients: this.convertFirestoreToSpoonacularIngredients(firestoreResults), 
            fromFirestore: true 
          });
        } else {
          console.log('📡 No results in Firestore, searching Spoonacular API...');
          // No results in Firestore, search API
          return this.searchIngredients(query, number).pipe(
            tap(apiResults => {
              // Cache API results in Firestore for future use
              if (apiResults.length > 0) {
                this.cacheIngredientsInFirestore(apiResults, query);
              }
            }),
            map(apiResults => ({ ingredients: apiResults, fromFirestore: false }))
          );
        }
      }),
      catchError(error => {
        console.error('Error in hybrid ingredient search:', error);
        // Fallback to API only
        return this.searchIngredients(query, number).pipe(
          map(apiResults => ({ ingredients: apiResults, fromFirestore: false }))
        );
      })
    );
  }

  /**
   * Search ingredients in Firestore cache
   */
  private searchIngredientsFromFirestore(searchQuery: string, limitNum: number = 10): Observable<FirestoreIngredient[]> {
    const queryText = searchQuery.toLowerCase().trim();
    
    return from(getDocs(
      firestoreQuery(
        this.ingredientsCollection,
        where('name', '>=', queryText),
        where('name', '<=', queryText + '\uf8ff'),
        orderBy('searchCount', 'desc'),
        firestoreLimit(limitNum)
      )
    )).pipe(
      map(snapshot => {
        const results: FirestoreIngredient[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          results.push({ id: doc.id, ...data } as FirestoreIngredient);
        });
        
        // Also search by partial name match if exact search yields few results
        if (results.length < 3) {
          // This would require a more complex query or client-side filtering
          // For now, return what we have
        }
        
        return results;
      }),
      catchError(error => {
        console.error('Error searching Firestore ingredients:', error);
        return of([]);
      })
    );
  }

  /**
   * Cache API ingredients in Firestore
   */
  private async cacheIngredientsInFirestore(ingredients: SpoonacularIngredient[], searchQuery?: string): Promise<void> {
    try {
      console.log(`💾 Caching ${ingredients.length} ingredients in Firestore`);
      
      for (const ingredient of ingredients) {
        const ingredientData: Omit<FirestoreIngredient, 'id'> = {
          spoonacularId: ingredient.id,
          name: (ingredient.nameClean || ingredient.name).toLowerCase(),
          nameClean: ingredient.nameClean,
          image: ingredient.image,
          aisle: ingredient.aisle,
          consistency: ingredient.consistency,
          original: ingredient.original,
          unit: ingredient.unit,
          amount: ingredient.amount,
          measures: ingredient.measures,
          addedAt: serverTimestamp(),
          searchCount: 1,
          isPopular: false
        };

        // Use spoonacular ID as document ID to avoid duplicates
        const docRef = doc(this.ingredientsCollection, `spoon_${ingredient.id}`);
        
        // Check if document exists
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Update search count
          await updateDoc(docRef, {
            searchCount: docSnap.data()['searchCount'] + 1,
            isPopular: docSnap.data()['searchCount'] >= 5
          });
        } else {
          // Create new document
          await setDoc(docRef, ingredientData);
        }
      }
    } catch (error) {
      console.error('Error caching ingredients in Firestore:', error);
    }
  }

  /**
   * Convert Firestore ingredients back to Spoonacular format
   */
  private convertFirestoreToSpoonacularIngredients(firestoreIngredients: FirestoreIngredient[]): SpoonacularIngredient[] {
    return firestoreIngredients.map(fsIngredient => ({
      id: fsIngredient.spoonacularId,
      aisle: fsIngredient.aisle,
      image: fsIngredient.image,
      consistency: fsIngredient.consistency || '',
      name: fsIngredient.nameClean || fsIngredient.name,
      nameClean: fsIngredient.nameClean || fsIngredient.name,
      original: fsIngredient.original || '',
      originalString: fsIngredient.original || '',
      originalName: fsIngredient.name,
      amount: fsIngredient.amount || 1,
      unit: fsIngredient.unit || 'unit',
      meta: [],
      metaInformation: [],
      measures: fsIngredient.measures || {
        us: { amount: 1, unitShort: 'unit', unitLong: 'unit' },
        metric: { amount: 1, unitShort: 'unit', unitLong: 'unit' }
      }
    }));
  }

  /**
   * Add an ingredient to Firestore database manually
   */
  async addIngredientToDatabase(ingredient: SpoonacularIngredient): Promise<void> {
    try {
      const ingredientData: Omit<FirestoreIngredient, 'id'> = {
        spoonacularId: ingredient.id,
        name: (ingredient.nameClean || ingredient.name).toLowerCase(),
        nameClean: ingredient.nameClean,
        image: ingredient.image,
        aisle: ingredient.aisle,
        consistency: ingredient.consistency,
        original: ingredient.original,
        unit: ingredient.unit,
        amount: ingredient.amount,
        measures: ingredient.measures,
        addedAt: serverTimestamp(),
        searchCount: 1,
        isPopular: false,
        addedBy: 'user' // Could be replaced with actual user ID
      };

      const docRef = doc(this.ingredientsCollection, `spoon_${ingredient.id}`);
      await setDoc(docRef, ingredientData, { merge: true });
      
      console.log(`✅ Added ingredient "${ingredient.name}" to database`);
    } catch (error) {
      console.error('Error adding ingredient to database:', error);
      throw error;
    }
  }

  /**
   * Get popular ingredients from Firestore
   */
  getPopularIngredients(limitNum: number = 10): Observable<SpoonacularIngredient[]> {
    return from(getDocs(
      firestoreQuery(
        this.ingredientsCollection,
        where('isPopular', '==', true),
        orderBy('searchCount', 'desc'),
        firestoreLimit(limitNum)
      )
    )).pipe(
      map(snapshot => {
        const results: FirestoreIngredient[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          results.push({ id: doc.id, ...data } as FirestoreIngredient);
        });
        return this.convertFirestoreToSpoonacularIngredients(results);
      }),
      catchError(error => {
        console.error('Error getting popular ingredients:', error);
        return of([]);
      })
    );
  }

  /**
   * HYBRID MENU SEARCH: Search menu items in Firestore first, then API as fallback
   */
  searchMenuItemsHybrid(query: string, number: number = 12): Observable<{ menuItems: SpoonacularMenuItem[], fromFirestore: boolean }> {
    console.log(`🔍 Hybrid search for menu items: "${query}"`);
    
    return this.searchMenuItemsFromFirestore(query, number).pipe(
      switchMap(firestoreResults => {
        if (firestoreResults.length > 0) {
          console.log(`✅ Found ${firestoreResults.length} menu items in Firestore cache`);
          return of({ 
            menuItems: this.convertFirestoreToSpoonacularMenuItems(firestoreResults), 
            fromFirestore: true 
          });
        } else {
          console.log('📡 No results in Firestore, searching Spoonacular API...');
          return this.searchRecipes(query, undefined, undefined, number).pipe(
            tap(apiResults => {
              if (apiResults.length > 0) {
                this.cacheMenuItemsInFirestore(apiResults, query);
              }
            }),
            map(apiResults => ({ menuItems: apiResults, fromFirestore: false }))
          );
        }
      }),
      catchError(error => {
        console.error('Error in hybrid menu search:', error);
        return this.searchRecipes(query, undefined, undefined, number).pipe(
          map(apiResults => ({ menuItems: apiResults, fromFirestore: false }))
        );
      })
    );
  }

  /**
   * Search menu items in Firestore cache
   */
  private searchMenuItemsFromFirestore(searchQuery: string, limitNum: number = 12): Observable<FirestoreMenuItem[]> {
    const queryText = searchQuery.toLowerCase().trim();
    
    return from(getDocs(
      firestoreQuery(
        this.menuItemsCollection,
        where('name', '>=', queryText),
        where('name', '<=', queryText + '\uf8ff'),
        orderBy('searchCount', 'desc'),
        firestoreLimit(limitNum)
      )
    )).pipe(
      map(snapshot => {
        const results: FirestoreMenuItem[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          results.push({ id: doc.id, ...data } as FirestoreMenuItem);
        });
        return results;
      }),
      catchError(error => {
        console.error('Error searching Firestore menu items:', error);
        return of([]);
      })
    );
  }

  /**
   * Cache menu items in Firestore
   */
  private async cacheMenuItemsInFirestore(menuItems: SpoonacularMenuItem[], searchQuery?: string): Promise<void> {
    try {
      console.log(`💾 Caching ${menuItems.length} menu items in Firestore`);
      
      for (const menuItem of menuItems) {
        const menuData: Omit<FirestoreMenuItem, 'id'> = {
          spoonacularId: menuItem.spoonacularId,
          name: menuItem.name.toLowerCase(),
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category,
          image: menuItem.image,
          ingredients: menuItem.ingredients,
          preparationTime: menuItem.preparationTime,
          isAvailable: menuItem.isAvailable,
          isPopular: menuItem.isPopular,
          allergens: menuItem.allergens,
          nutritionalInfo: menuItem.nutritionalInfo,
          servings: menuItem.servings,
          healthScore: menuItem.healthScore,
          vegan: menuItem.vegan,
          vegetarian: menuItem.vegetarian,
          glutenFree: menuItem.glutenFree,
          dairyFree: menuItem.dairyFree,
          addedAt: serverTimestamp(),
          searchCount: 1
        };

        const docRef = doc(this.menuItemsCollection, menuItem.id);
        
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await updateDoc(docRef, {
            searchCount: docSnap.data()['searchCount'] + 1,
            isPopular: docSnap.data()['searchCount'] >= 3
          });
        } else {
          await setDoc(docRef, menuData);
        }
      }
    } catch (error) {
      console.error('Error caching menu items in Firestore:', error);
    }
  }

  /**
   * Convert Firestore menu items back to Spoonacular format
   */
  private convertFirestoreToSpoonacularMenuItems(firestoreMenuItems: FirestoreMenuItem[]): SpoonacularMenuItem[] {
    return firestoreMenuItems.map(fsMenuItem => ({
      id: fsMenuItem.id,
      name: fsMenuItem.name,
      description: fsMenuItem.description,
      price: fsMenuItem.price,
      category: fsMenuItem.category,
      image: fsMenuItem.image,
      ingredients: fsMenuItem.ingredients,
      preparationTime: fsMenuItem.preparationTime,
      isAvailable: fsMenuItem.isAvailable,
      isPopular: fsMenuItem.isPopular,
      allergens: fsMenuItem.allergens,
      nutritionalInfo: fsMenuItem.nutritionalInfo,
      spoonacularId: fsMenuItem.spoonacularId || 0,
      servings: fsMenuItem.servings,
      healthScore: fsMenuItem.healthScore,
      vegan: fsMenuItem.vegan,
      vegetarian: fsMenuItem.vegetarian,
      glutenFree: fsMenuItem.glutenFree,
      dairyFree: fsMenuItem.dairyFree
    }));
  }

  /**
   * Add a menu item to Firestore database manually
   */
  async addMenuItemToDatabase(menuItem: SpoonacularMenuItem): Promise<void> {
    try {
      const menuData: Omit<FirestoreMenuItem, 'id'> = {
        spoonacularId: menuItem.spoonacularId,
        name: menuItem.name.toLowerCase(),
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        image: menuItem.image,
        ingredients: menuItem.ingredients,
        preparationTime: menuItem.preparationTime,
        isAvailable: menuItem.isAvailable,
        isPopular: menuItem.isPopular,
        allergens: menuItem.allergens,
        nutritionalInfo: menuItem.nutritionalInfo,
        servings: menuItem.servings,
        healthScore: menuItem.healthScore,
        vegan: menuItem.vegan,
        vegetarian: menuItem.vegetarian,
        glutenFree: menuItem.glutenFree,
        dairyFree: menuItem.dairyFree,
        addedAt: serverTimestamp(),
        searchCount: 1,
        addedBy: 'user'
      };

      const docRef = doc(this.menuItemsCollection, menuItem.id);
      await setDoc(docRef, menuData, { merge: true });
      
      console.log(`✅ Added menu item "${menuItem.name}" to database`);
    } catch (error) {
      console.error('Error adding menu item to database:', error);
      throw error;
    }
  }

  /**
   * Get popular menu items from Firestore
   */
  getPopularMenuItems(limitNum: number = 10): Observable<SpoonacularMenuItem[]> {
    return from(getDocs(
      firestoreQuery(
        this.menuItemsCollection,
        where('isPopular', '==', true),
        orderBy('searchCount', 'desc'),
        firestoreLimit(limitNum)
      )
    )).pipe(
      map(snapshot => {
        const results: FirestoreMenuItem[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          results.push({ id: doc.id, ...data } as FirestoreMenuItem);
        });
        return this.convertFirestoreToSpoonacularMenuItems(results);
      }),
      catchError(error => {
        console.error('Error getting popular menu items:', error);
        return of([]);
      })
    );
  }

  /**
   * Get detailed information for a specific ingredient by ID
   */
  getIngredientInformation(id: number, amount: number = 1, unit: string = 'unit'): Observable<SpoonacularIngredient> {
    let params = new HttpParams()
      .set('apiKey', this.API_KEY)
      .set('amount', amount.toString())
      .set('unit', unit);
    return this.http.get<SpoonacularIngredient>(`${this.BASE_URL}/food/ingredients/${id}/information`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching ingredient information:', error);
          return of(null as any);
        })
      );
  }
}
