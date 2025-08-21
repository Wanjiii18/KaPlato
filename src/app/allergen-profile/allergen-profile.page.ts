import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UserService, UserProfile } from '../services/user.service';
import { ProfileService } from '../services/profile.service';
import { AllergenDetectionService } from '../services/allergen-detection.service';
import { Allergen } from '../services/auth.service';

@Component({
  selector: 'app-allergen-profile',
  templateUrl: './allergen-profile.page.html',
  styleUrls: ['./allergen-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AllergenProfilePage implements OnInit {
  userProfile: UserProfile | null = null;
  userAllergens: Allergen[] = [];
  
  // Common allergens with Filipino context
  commonAllergens = [
    { name: 'Peanuts', description: 'Including mani, kare-kare sauce', severity: 'severe', checked: false },
    { name: 'Tree Nuts', description: 'Cashew, almonds, coconut products', severity: 'severe', checked: false },
    { name: 'Dairy', description: 'Milk, cheese, gatas, kesong puti', severity: 'moderate', checked: false },
    { name: 'Eggs', description: 'Itlog, balut, kwek-kwek', severity: 'moderate', checked: false },
    { name: 'Fish', description: 'Isda, patis, bagoong, fish sauce', severity: 'severe', checked: false },
    { name: 'Shellfish', description: 'Hipon, alimango, talaba, sugpo', severity: 'severe', checked: false },
    { name: 'Soy', description: 'Toyo, tokwa, taho, soy sauce', severity: 'moderate', checked: false },
    { name: 'Wheat', description: 'Bread, pasta, tinapay, harina', severity: 'moderate', checked: false },
    { name: 'Sesame', description: 'Sesame seeds, tahini, linga', severity: 'mild', checked: false },
    { name: 'Mustard', description: 'Mustard seeds, sauce', severity: 'mild', checked: false }
  ];

  selectedAllergens: Set<string> = new Set();
  customAllergen = '';
  isLoading = false;

  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private allergenService: AllergenDetectionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.userService.currentUserProfile$.subscribe(profile => {
      this.userProfile = profile;
      if (profile?.allergens) {
        this.userAllergens = profile.allergens;
        // Update selected allergens set
        this.selectedAllergens = new Set(profile.allergens.map(a => a.name));
        // Sync checked states with common allergens
        this.commonAllergens.forEach(allergen => {
          allergen.checked = this.selectedAllergens.has(allergen.name);
        });
      }
    });
  }

  onAllergenToggle(allergen: any, event: any) {
    allergen.checked = event.detail.checked;
    if (event.detail.checked) {
      this.selectedAllergens.add(allergen.name);
    } else {
      this.selectedAllergens.delete(allergen.name);
    }
  }

  isAllergenSelected(allergenName: string): boolean {
    return this.selectedAllergens.has(allergenName);
  }

  async addCustomAllergen() {
    if (!this.customAllergen.trim()) {
      await this.showToast('Please enter an allergen name', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Add Custom Allergen',
      message: `Add "${this.customAllergen}" to your allergen list?`,
      inputs: [
        {
          name: 'severity',
          type: 'radio',
          label: 'Mild Reaction',
          value: 'mild',
          checked: true
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderate Reaction',
          value: 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severe Reaction',
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
            this.selectedAllergens.add(this.customAllergen.trim());
            this.customAllergen = '';
            await this.showToast('Custom allergen added', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async removeAllergen(allergenName: string) {
    const alert = await this.alertController.create({
      header: 'Remove Allergen',
      message: `Remove "${allergenName}" from your allergen list?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: () => {
            this.selectedAllergens.delete(allergenName);
            this.showToast('Allergen removed', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async saveAllergenProfile() {
    if (!this.userProfile) {
      await this.showToast('User profile not loaded', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving allergen profile...'
    });
    await loading.present();

    try {
      // Convert selected allergens to allergen objects
      const allergenObjects: Allergen[] = Array.from(this.selectedAllergens).map(name => {
        const commonAllergen = this.commonAllergens.find(a => a.name === name);
        const existingAllergen = this.userAllergens.find(a => a.name === name);
        
        return {
          id: existingAllergen?.id || Date.now().toString(),
          name,
          category: 'Food',
          severity: existingAllergen?.severity || commonAllergen?.severity || 'moderate',
          addedAt: existingAllergen?.addedAt || new Date()
        } as Allergen;
      });

      // Save to profile service
      for (const allergen of allergenObjects) {
        if (!this.userAllergens.find(a => a.name === allergen.name)) {
          await this.profileService.addAllergen(this.userProfile.uid, allergen);
        }
      }

      // Remove allergens that are no longer selected
      for (const existingAllergen of this.userAllergens) {
        if (!this.selectedAllergens.has(existingAllergen.name)) {
          await this.profileService.removeAllergen(this.userProfile.uid, existingAllergen.id);
        }
      }

      // Update the allergen detection service
      this.allergenService.updateUserAllergens(allergenObjects);

      await this.showToast('Allergen profile saved successfully!', 'success');
      
      // Optional: Navigate back or to a test page
      // this.router.navigate(['/home']);
      
    } catch (error) {
      console.error('Error saving allergen profile:', error);
      await this.showToast('Error saving allergen profile', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async testMealDetection() {
    // Sample meals for testing
    const testMeals = [
      {
        name: 'Adobong Manok',
        ingredients: ['Chicken', 'Soy Sauce', 'Vinegar', 'Garlic', 'Bay Leaves']
      },
      {
        name: 'Kare-Kare',
        ingredients: ['Oxtail', 'Peanut Butter', 'Eggplant', 'String Beans']
      },
      {
        name: 'Sinigang na Baboy',
        ingredients: ['Pork', 'Tamarind', 'Tomatoes', 'Kangkong', 'Fish Sauce']
      },
      {
        name: 'Lechon Kawali',
        ingredients: ['Pork Belly', 'Salt', 'Bay Leaves']
      }
    ];

    const alert = await this.alertController.create({
      header: 'Meal Safety Test',
      message: 'Testing your allergen profile against sample Filipino meals:',
      buttons: ['OK']
    });

    // Update allergen service with current selections first
    const currentAllergens = Array.from(this.selectedAllergens).map(name => ({
      name,
      severity: this.commonAllergens.find(a => a.name === name)?.severity || 'moderate'
    }));
    this.allergenService.updateUserAllergens(currentAllergens);

    // Test each meal
    let testResults = '<br>';
    for (const meal of testMeals) {
      const analysis = this.allergenService.analyzeMealSafety(meal.ingredients, meal.name);
      const status = analysis.isSafe ? '✅ SAFE' : `⚠️ ${analysis.riskLevel.toUpperCase()} RISK`;
      testResults += `<strong>${meal.name}:</strong> ${status}<br>`;
      
      if (!analysis.isSafe) {
        testResults += `<small>Warnings: ${analysis.warnings.map(w => w.allergen).join(', ')}</small><br>`;
      }
      testResults += '<br>';
    }

    alert.message += testResults;
    await alert.present();
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'severe': return 'danger';
      case 'moderate': return 'warning';
      case 'mild': return 'primary';
      default: return 'medium';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'severe': return 'warning';
      case 'moderate': return 'alert-circle-outline';
      case 'mild': return 'information-circle-outline';
      default: return 'help-outline';
    }
  }

  goToMealDiscovery() {
    this.router.navigate(['/meal-discovery']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
