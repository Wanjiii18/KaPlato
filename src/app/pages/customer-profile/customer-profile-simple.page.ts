import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UserService, UserProfile } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService, Allergen, MealPlan } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile-simple.page.html',
  styleUrls: ['./customer-profile-simple.page.scss'],
  standalone: false
})
export class CustomerProfilePageSimple implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  selectedSegment = 'general';
  
  // Allergen management
  allergens: Allergen[] = [];
  predefinedAllergens: string[] = [];
  
  // Meal plan management
  mealPlans: MealPlan[] = [];
  
  // Preferences
  dietaryRestrictions: string[] = [];
  cuisinePreferences: string[] = [];
  
  // Subscription management
  private profileSubscription?: Subscription;
  
  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.predefinedAllergens = this.profileService.getPredefinedAllergens().map(a => a.name);
    this.dietaryRestrictions = this.profileService.getDietaryRestrictions();
    this.cuisinePreferences = this.profileService.getCuisinePreferences();
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  loadUserProfile() {
    this.profileSubscription = this.userService.currentUserProfile$.subscribe(profile => {
      console.log('Profile received:', profile);
      this.userProfile = profile;
      if (profile) {
        this.allergens = profile.allergens || [];
        this.mealPlans = profile.mealPlans || [];
      }
    });
  }

  calculateBMI(): string {
    if (this.userProfile?.healthInfo?.weight && this.userProfile?.healthInfo?.height) {
      const heightInMeters = this.userProfile.healthInfo.height / 100;
      const bmi = this.userProfile.healthInfo.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '';
  }

  async updateHealthInfo() {
    const alert = await this.alertController.create({
      header: 'Update Health Information',
      inputs: [
        {
          name: 'weight',
          type: 'number',
          placeholder: 'Weight (kg)',
          value: this.userProfile?.healthInfo?.weight || ''
        },
        {
          name: 'height',
          type: 'number',
          placeholder: 'Height (cm)',
          value: this.userProfile?.healthInfo?.height || ''
        },
        {
          name: 'activityLevel',
          type: 'text',
          placeholder: 'Activity Level (Sedentary, Light, Moderate, Active, Very Active)',
          value: this.userProfile?.healthInfo?.activityLevel || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.weight && data.height) {
              await this.saveHealthInfo(data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async saveHealthInfo(healthData: any) {
    const loading = await this.loadingController.create({
      message: 'Updating health information...'
    });
    await loading.present();

    try {
      // Update the user profile with health information
      if (this.userProfile) {
        this.userProfile.healthInfo = {
          ...this.userProfile.healthInfo,
          weight: parseFloat(healthData.weight),
          height: parseFloat(healthData.height),
          activityLevel: healthData.activityLevel
        };
        
        await this.userService.updateUserProfile(this.userProfile);
        
        const toast = await this.toastController.create({
          message: 'Health information updated successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error updating health info:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update health information',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async updateNutritionGoals() {
    const alert = await this.alertController.create({
      header: 'Update Nutrition Goals',
      inputs: [
        {
          name: 'dailyCalories',
          type: 'number',
          placeholder: 'Daily Calories',
          value: this.userProfile?.nutritionGoals?.dailyCalories || ''
        },
        {
          name: 'protein',
          type: 'number',
          placeholder: 'Protein (g)',
          value: this.userProfile?.nutritionGoals?.protein || ''
        },
        {
          name: 'carbohydrates',
          type: 'number',
          placeholder: 'Carbohydrates (g)',
          value: this.userProfile?.nutritionGoals?.carbohydrates || ''
        },
        {
          name: 'fat',
          type: 'number',
          placeholder: 'Fat (g)',
          value: this.userProfile?.nutritionGoals?.fat || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            await this.saveNutritionGoals(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async saveNutritionGoals(nutritionData: any) {
    const loading = await this.loadingController.create({
      message: 'Updating nutrition goals...'
    });
    await loading.present();

    try {
      if (this.userProfile) {
        this.userProfile.nutritionGoals = {
          dailyCalories: parseFloat(nutritionData.dailyCalories) || 0,
          protein: parseFloat(nutritionData.protein) || 0,
          carbohydrates: parseFloat(nutritionData.carbohydrates) || 0,
          fat: parseFloat(nutritionData.fat) || 0
        };
        
        await this.userService.updateUserProfile(this.userProfile);
        
        const toast = await this.toastController.create({
          message: 'Nutrition goals updated successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error updating nutrition goals:', error);
      const toast = await this.toastController.create({
        message: 'Failed to update nutrition goals',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  // Allergen Management
  async addAllergen() {
    const alert = await this.alertController.create({
      header: 'Add Allergen',
      inputs: [
        {
          name: 'allergenName',
          type: 'text',
          placeholder: 'Enter allergen name or select from list'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Mild',
          value: 'mild',
          checked: true
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderate',
          value: 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severe',
          value: 'severe'
        },
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Additional notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Select from List',
          handler: () => {
            this.showAllergenList();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (data) => {
            if (data.allergenName?.trim()) {
              await this.saveAllergen(data.allergenName.trim(), data.severity, data.notes);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showAllergenList() {
    const alert = await this.alertController.create({
      header: 'Select Allergen',
      inputs: this.predefinedAllergens.map(allergen => ({
        name: 'allergen',
        type: 'radio',
        label: allergen,
        value: allergen
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Next',
          handler: async (selectedAllergen) => {
            if (selectedAllergen) {
              await this.showSeveritySelection(selectedAllergen);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showSeveritySelection(allergenName: string) {
    const alert = await this.alertController.create({
      header: `Set Severity for ${allergenName}`,
      inputs: [
        {
          name: 'severity',
          type: 'radio',
          label: 'Mild',
          value: 'mild',
          checked: true
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderate',
          value: 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severe',
          value: 'severe'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (data) => {
            await this.saveAllergen(allergenName, data.severity);
          }
        }
      ]
    });

    await alert.present();
  }

  async saveAllergen(name: string, severity: 'mild' | 'moderate' | 'severe', notes?: string) {
    const loading = await this.loadingController.create({
      message: 'Adding allergen...'
    });
    await loading.present();

    try {
      const newAllergen: Allergen = {
        id: Date.now().toString(),
        name,
        category: 'custom',
        severity,
        notes,
        addedAt: new Date()
      };

      this.allergens.push(newAllergen);
      
      if (this.userProfile) {
        this.userProfile.allergens = this.allergens;
        await this.userService.updateUserProfile(this.userProfile);
      }

      const toast = await this.toastController.create({
        message: `${name} allergen added successfully!`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error saving allergen:', error);
      const toast = await this.toastController.create({
        message: 'Failed to add allergen',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async removeAllergen(allergen: Allergen) {
    const alert = await this.alertController.create({
      header: 'Remove Allergen',
      message: `Are you sure you want to remove ${allergen.name} from your allergens list?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            await this.confirmRemoveAllergen(allergen);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmRemoveAllergen(allergen: Allergen) {
    const loading = await this.loadingController.create({
      message: 'Removing allergen...'
    });
    await loading.present();

    try {
      this.allergens = this.allergens.filter(a => a.id !== allergen.id);
      
      if (this.userProfile) {
        this.userProfile.allergens = this.allergens;
        await this.userService.updateUserProfile(this.userProfile);
      }

      const toast = await this.toastController.create({
        message: `${allergen.name} removed successfully!`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error removing allergen:', error);
      const toast = await this.toastController.create({
        message: 'Failed to remove allergen',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  // Meal Plan Management
  async addMealPlan() {
    const alert = await this.alertController.create({
      header: 'Create Meal Plan',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Meal plan name'
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)'
        },
        {
          name: 'startDate',
          type: 'date',
          placeholder: 'Start date'
        },
        {
          name: 'endDate',
          type: 'date',
          placeholder: 'End date'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.name?.trim()) {
              await this.saveMealPlan(data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async saveMealPlan(planData: any) {
    const loading = await this.loadingController.create({
      message: 'Creating meal plan...'
    });
    await loading.present();

    try {
      const newMealPlan: MealPlan = {
        id: Date.now().toString(),
        name: planData.name,
        description: planData.description,
        duration: 30, // Default 30 days
        caloriesPerDay: 2000, // Default value
        type: 'custom',
        startDate: planData.startDate ? new Date(planData.startDate) : undefined,
        endDate: planData.endDate ? new Date(planData.endDate) : undefined,
        isActive: this.mealPlans.length === 0
      };

      this.mealPlans.push(newMealPlan);
      
      if (this.userProfile) {
        this.userProfile.mealPlans = this.mealPlans;
        await this.userService.updateUserProfile(this.userProfile);
      }

      const toast = await this.toastController.create({
        message: 'Meal plan created successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error creating meal plan:', error);
      const toast = await this.toastController.create({
        message: 'Failed to create meal plan',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async setActiveMealPlan(mealPlan: MealPlan) {
    this.mealPlans.forEach(plan => plan.isActive = false);
    mealPlan.isActive = true;
    
    if (this.userProfile) {
      this.userProfile.mealPlans = this.mealPlans;
      await this.userService.updateUserProfile(this.userProfile);
    }

    const toast = await this.toastController.create({
      message: `${mealPlan.name} is now your active meal plan!`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }

  async removeMealPlan(mealPlan: MealPlan) {
    const alert = await this.alertController.create({
      header: 'Remove Meal Plan',
      message: `Are you sure you want to remove "${mealPlan.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            await this.confirmRemoveMealPlan(mealPlan);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmRemoveMealPlan(mealPlan: MealPlan) {
    const loading = await this.loadingController.create({
      message: 'Removing meal plan...'
    });
    await loading.present();

    try {
      this.mealPlans = this.mealPlans.filter(plan => plan.id !== mealPlan.id);
      
      if (this.userProfile) {
        this.userProfile.mealPlans = this.mealPlans;
        await this.userService.updateUserProfile(this.userProfile);
      }

      const toast = await this.toastController.create({
        message: 'Meal plan removed successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error removing meal plan:', error);
      const toast = await this.toastController.create({
        message: 'Failed to remove meal plan',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  formatDate(dateInput: string | Date): string {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
