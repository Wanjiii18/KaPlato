import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UserService, UserProfile } from '../services/user.service';
import { ProfileService } from '../services/profile.service';
import { AuthService, Allergen, MealPlan } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProfilePage implements OnInit, OnDestroy {
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
    if (!this.userProfile) return;

    const loading = await this.loadingController.create({
      message: 'Adding allergen...'
    });
    await loading.present();

    try {
      await this.profileService.addAllergen(this.userProfile.uid, {
        name,
        category: 'Other', // Default category
        severity,
        notes: notes?.trim() || undefined
      });

      const toast = await this.toastController.create({
        message: 'Allergen added successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error adding allergen',
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
      message: `Are you sure you want to remove "${allergen.name}" from your allergens list?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: async () => {
            if (!this.userProfile) return;

            const loading = await this.loadingController.create({
              message: 'Removing allergen...'
            });
            await loading.present();

            try {
              await this.profileService.removeAllergen(this.userProfile.uid, allergen.id);
              
              const toast = await this.toastController.create({
                message: 'Allergen removed successfully',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Error removing allergen',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Meal Plan Management
  async addMealPlan() {
    const alert = await this.alertController.create({
      header: 'Create Meal Plan',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Meal plan name',
          attributes: {
            required: true
          }
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)'
        },
        {
          name: 'startDate',
          type: 'date',
          min: new Date().toISOString().split('T')[0]
        },
        {
          name: 'endDate',
          type: 'date',
          min: new Date().toISOString().split('T')[0]
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

  async saveMealPlan(data: any) {
    if (!this.userProfile) return;

    const loading = await this.loadingController.create({
      message: 'Creating meal plan...'
    });
    await loading.present();

    try {
      const mealPlan: Omit<MealPlan, 'id'> = {
        name: data.name.trim(),
        description: data.description?.trim(),
        duration: 7, // Default 7 days
        caloriesPerDay: 2000, // Default calories
        type: 'custom',
        meals: [],
        startDate: new Date(data.startDate || Date.now()),
        endDate: new Date(data.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
        isActive: this.mealPlans.length === 0 // First meal plan is active by default
      };

      await this.profileService.addMealPlan(this.userProfile.uid, mealPlan);

      const toast = await this.toastController.create({
        message: 'Meal plan created successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error creating meal plan',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async setActiveMealPlan(mealPlan: MealPlan) {
    if (!this.userProfile) return;

    const loading = await this.loadingController.create({
      message: 'Setting active meal plan...'
    });
    await loading.present();

    try {
      await this.profileService.setActiveMealPlan(this.userProfile.uid, mealPlan.id);
      
      const toast = await this.toastController.create({
        message: `"${mealPlan.name}" is now your active meal plan`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error setting active meal plan',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
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
          handler: async () => {
            if (!this.userProfile) return;

            const loading = await this.loadingController.create({
              message: 'Removing meal plan...'
            });
            await loading.present();

            try {
              await this.profileService.removeMealPlan(this.userProfile.uid, mealPlan.id);
              
              const toast = await this.toastController.create({
                message: 'Meal plan removed successfully',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Error removing meal plan',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getSeverityColor(severity?: string): string {
    switch (severity) {
      case 'mild': return 'success';
      case 'moderate': return 'warning';
      case 'severe': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
