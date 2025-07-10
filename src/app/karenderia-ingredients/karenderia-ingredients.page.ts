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
  searchQuery = '';
  searchResults: SpoonacularIngredient[] = [];
  selectedIngredient: SpoonacularIngredient | null = null;
  isLoading = false;

  constructor(
    private spoonacularService: SpoonacularService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
  }

  async searchIngredients() {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Searching ingredients...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.spoonacularService.searchIngredients(this.searchQuery).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.selectedIngredient = null;
          this.isLoading = false;
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error searching ingredients:', error);
          this.showErrorToast('Error searching ingredients. Please try again.');
          this.isLoading = false;
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error searching ingredients:', error);
      this.showErrorToast('Error searching ingredients. Please try again.');
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async getIngredientDetails(ingredientId: number) {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading ingredient details...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.spoonacularService.getIngredientInformation(ingredientId).subscribe({
        next: (ingredient) => {
          this.selectedIngredient = ingredient;
          this.isLoading = false;
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error getting ingredient details:', error);
          this.showErrorToast('Error loading ingredient details. Please try again.');
          this.isLoading = false;
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error getting ingredient details:', error);
      this.showErrorToast('Error loading ingredient details. Please try again.');
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }

  clearResults() {
    this.searchResults = [];
    this.selectedIngredient = null;
    this.searchQuery = '';
  }

  backToResults() {
    this.selectedIngredient = null;
  }

}
