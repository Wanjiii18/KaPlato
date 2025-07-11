import { Component, OnInit } from '@angular/core';
import { SpoonacularService, SpoonacularIngredient } from '../services/spoonacular.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-karenderia-ingredients',
  templateUrl: './karenderia-ingredients.page.html',
  styleUrls: ['./karenderia-ingredients.page.scss'],
  standalone: false,
})
export class KarenderiaIngredientsPage implements OnInit {
  searchQuery: string = '';
  ingredients: SpoonacularIngredient[] = [];
  popularIngredients: SpoonacularIngredient[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;
  lastSearchFromFirestore: boolean = false;

  constructor(
    private spoonacularService: SpoonacularService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Load popular ingredients and test API connection
    this.loadPopularIngredients();
    this.testApiConnection();
  }

  async loadPopularIngredients() {
    try {
      this.spoonacularService.getPopularIngredients(8).subscribe({
        next: (popular) => {
          this.popularIngredients = popular;
          console.log(`📊 Loaded ${popular.length} popular ingredients from database`);
        },
        error: (error) => {
          console.error('Error loading popular ingredients:', error);
        }
      });
    } catch (error) {
      console.error('Error in loadPopularIngredients:', error);
    }
  }

  async testApiConnection() {
    try {
      const loading = await this.loadingController.create({
        message: 'Testing API connection...',
        duration: 3000
      });
      await loading.present();

      this.spoonacularService.testApi().subscribe({
        next: (result) => {
          console.log('✅ API Test Successful! Retrieved recipe:', result);
          loading.dismiss();
          this.presentToast('API connection successful!', 'success');
        },
        error: (error) => {
          console.error('❌ API Test Failed:', error);
          loading.dismiss();
          this.presentToast('API connection failed. Please check your internet connection.', 'danger');
        }
      });
    } catch (error) {
      console.error('Error testing API:', error);
    }
  }

  async searchIngredients() {
    if (!this.searchQuery.trim()) {
      this.presentToast('Please enter an ingredient name to search', 'warning');
      return;
    }

    this.isLoading = true;
    this.hasSearched = false;

    try {
      const loading = await this.loadingController.create({
        message: 'Searching ingredients...',
        duration: 10000
      });
      await loading.present();

      // Use hybrid search (Firestore + API)
      this.spoonacularService.searchIngredientsHybrid(this.searchQuery, 20).subscribe({
        next: (result) => {
          console.log('🔍 Hybrid Search Results:', result);
          this.ingredients = result.ingredients;
          this.lastSearchFromFirestore = result.fromFirestore;
          this.hasSearched = true;
          this.isLoading = false;
          loading.dismiss();

          if (result.ingredients.length === 0) {
            this.presentToast('No ingredients found. Try a different search term.', 'warning');
          } else {
            const source = result.fromFirestore ? 'database cache' : 'Spoonacular API';
            this.presentToast(`Found ${result.ingredients.length} ingredients from ${source}`, 'success');
          }
        },
        error: (error) => {
          console.error('❌ Hybrid Search Error:', error);
          this.isLoading = false;
          this.hasSearched = true;
          loading.dismiss();
          this.presentToast('Failed to search ingredients. Please try again.', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in searchIngredients:', error);
      this.isLoading = false;
      this.hasSearched = true;
    }
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  getIngredientImageUrl(ingredient: SpoonacularIngredient): string {
    if (ingredient.image) {
      return `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`;
    }
    return 'assets/images/placeholder-food.jpg';
  }

  clearSearch() {
    this.searchQuery = '';
    this.ingredients = [];
    this.hasSearched = false;
  }

  trackByIngredientId(index: number, ingredient: SpoonacularIngredient): number {
    return ingredient.id;
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder-food.jpg';
  }

  async addIngredientToDatabase(ingredient: SpoonacularIngredient) {
    try {
      const loading = await this.loadingController.create({
        message: 'Adding ingredient to database...',
        duration: 5000
      });
      await loading.present();

      await this.spoonacularService.addIngredientToDatabase(ingredient);
      loading.dismiss();
      
      this.presentToast(`"${ingredient.name}" added to ingredient database!`, 'success');
      
      // Refresh popular ingredients
      this.loadPopularIngredients();
    } catch (error) {
      console.error('Error adding ingredient to database:', error);
      this.presentToast('Failed to add ingredient to database', 'danger');
    }
  }

  selectPopularIngredient(ingredient: SpoonacularIngredient) {
    this.searchQuery = ingredient.name;
    this.searchIngredients();
  }
}
