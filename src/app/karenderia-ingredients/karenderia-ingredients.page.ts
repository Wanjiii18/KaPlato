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
  isLoading: boolean = false;
  hasSearched: boolean = false;

  constructor(
    private spoonacularService: SpoonacularService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Perform a test search on load
    this.testApiConnection();
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

      this.spoonacularService.searchIngredients(this.searchQuery, 20).subscribe({
        next: (results) => {
          console.log('🔍 Search Results:', results);
          this.ingredients = results;
          this.hasSearched = true;
          this.isLoading = false;
          loading.dismiss();

          if (results.length === 0) {
            this.presentToast('No ingredients found. Try a different search term.', 'warning');
          } else {
            this.presentToast(`Found ${results.length} ingredients`, 'success');
          }
        },
        error: (error) => {
          console.error('❌ Search Error:', error);
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
}
