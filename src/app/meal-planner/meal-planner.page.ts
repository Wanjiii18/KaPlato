import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.network';

@Component({
  selector: 'app-meal-planner',
  templateUrl: './meal-planner.page.html',
  styleUrls: ['./meal-planner.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule]
})
export class MealPlannerPage implements OnInit {
  mealPlan = {
    breakfast: '',
    lunch: '',
    dinner: ''
  };

  mealOptions: string[] = [];
  isSubmitting = false;

  constructor(
    private http: HttpClient, 
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchMealOptions();
  }

  fetchMealOptions() {
    const url = `${environment.spoonacular.baseUrl}/recipes/complexSearch?apiKey=${environment.spoonacular.apiKey}&number=50`;

    this.http.get<any>(url).subscribe(
      (data) => {
        console.log('Spoonacular API Response:', data);
        if (data && data.results) {
          this.mealOptions = data.results.map((recipe: any) => recipe.title);
        } else {
          console.error('Unexpected API response format:', data);
          this.showErrorAlert('Failed to load meal options. Please try again.');
        }
      },
      (error) => {
        console.error('Error fetching meal options from Spoonacular:', error);
        this.showErrorAlert('Failed to load meal options. Please check your connection.');
      }
    );
  }

  async saveMealPlan() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    const url = `${environment.apiUrl}/meal-plans`;

    this.http.post(url, this.mealPlan).subscribe(
      async (response) => {
        console.log('Meal Plan successfully saved to the database:', response);
        this.isSubmitting = false;
        
        const alert = await this.alertController.create({
          header: 'Success!',
          message: 'Your meal plan has been created successfully!',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.router.navigate(['/home']);
            }
          }]
        });
        await alert.present();
      },
      async (error) => {
        console.error('Error saving Meal Plan to the database:', error);
        this.isSubmitting = false;
        this.showErrorAlert('Failed to create meal plan. Please try again.');
      }
    );
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
