import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  ToastController,
  AlertController,
  IonToggle,
  IonCheckbox,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonBackButton
} from '@ionic/angular/standalone';

interface UserAllergenSettings {
  selected_allergens: string[];
  severity_levels: { [key: string]: string };
  custom_allergens: string[];
  dietary_restrictions: string[];
  auto_scan: boolean;
  alert_level: string;
  emergency_contact?: string;
  medical_notes?: string;
}

@Component({
  selector: 'app-allergen-profile',
  templateUrl: './allergen-profile.page.html',
  styleUrls: ['./allergen-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonToggle,
    IonCheckbox,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonBackButton
  ]
})
export class AllergenProfilePage implements OnInit {
  
  userSettings: UserAllergenSettings = {
    selected_allergens: [],
    severity_levels: {},
    custom_allergens: [],
    dietary_restrictions: [],
    auto_scan: true,
    alert_level: 'medium'
  };
  
  availableAllergens = [
    { name: 'Peanuts', category: 'Nuts', description: 'Peanuts and peanut-derived products' },
    { name: 'Tree Nuts', category: 'Nuts', description: 'Almonds, walnuts, cashews, etc.' },
    { name: 'Shellfish', category: 'Seafood', description: 'Shrimp, crab, lobster, mollusks' },
    { name: 'Fish', category: 'Seafood', description: 'All types of fish' },
    { name: 'Dairy', category: 'Animal Products', description: 'Milk and milk products' },
    { name: 'Eggs', category: 'Animal Products', description: 'Chicken eggs and egg products' },
    { name: 'Soy', category: 'Legumes', description: 'Soybeans and soy products' },
    { name: 'Wheat', category: 'Grains', description: 'Wheat and wheat-containing products' },
    { name: 'Gluten', category: 'Grains', description: 'Gluten-containing grains' },
    { name: 'Sesame', category: 'Seeds', description: 'Sesame seeds and sesame oil' },
    { name: 'Sulfites', category: 'Additives', description: 'Sulfur dioxide and sulfites' },
    { name: 'MSG', category: 'Additives', description: 'Monosodium glutamate' }
  ];
  
  dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Halal',
    'Kosher',
    'Low Sodium',
    'Low Sugar',
    'Diabetic Friendly',
    'Heart Healthy',
    'Low Fat',
    'High Protein',
    'Keto',
    'Paleo'
  ];
  
  allergenCategories = ['Nuts', 'Seafood', 'Animal Products', 'Legumes', 'Grains', 'Seeds', 'Additives'];
  
  newCustomAllergen = '';
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUserSettings();
  }
  
  loadUserSettings() {
    const savedSettings = localStorage.getItem('allergen-settings');
    if (savedSettings) {
      this.userSettings = JSON.parse(savedSettings);
    }
  }
  
  saveUserSettings() {
    localStorage.setItem('allergen-settings', JSON.stringify(this.userSettings));
  }

  // Allergen Management
  toggleAllergen(allergenName: string) {
    const index = this.userSettings.selected_allergens.indexOf(allergenName);
    if (index > -1) {
      this.userSettings.selected_allergens.splice(index, 1);
      delete this.userSettings.severity_levels[allergenName];
    } else {
      this.userSettings.selected_allergens.push(allergenName);
      this.userSettings.severity_levels[allergenName] = 'moderate';
    }
    this.saveUserSettings();
  }

  isAllergenSelected(allergenName: string): boolean {
    return this.userSettings.selected_allergens.includes(allergenName);
  }

  setSeverity(allergenName: string, severity: string) {
    if (this.isAllergenSelected(allergenName)) {
      this.userSettings.severity_levels[allergenName] = severity;
      this.saveUserSettings();
    }
  }

  getSeverity(allergenName: string): string {
    return this.userSettings.severity_levels[allergenName] || 'moderate';
  }

  getSelectedAllergensCount(): number {
    return this.userSettings.selected_allergens.length;
  }

  getCustomAllergensCount(): number {
    return this.userSettings.custom_allergens.length;
  }

  getDietaryRestrictionsCount(): number {
    return this.userSettings.dietary_restrictions.length;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Nuts': return 'leaf-outline';
      case 'Seafood': return 'fish-outline';
      case 'Animal Products': return 'cow-outline';
      case 'Legumes': return 'nutrition-outline';
      case 'Grains': return 'barbell-outline';
      case 'Seeds': return 'flower-outline';
      case 'Additives': return 'flask-outline';
      default: return 'alert-circle-outline';
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'mild': return 'primary';
      case 'moderate': return 'warning';
      case 'severe': return 'danger';
      default: return 'medium';
    }
  }

  // Filter allergens by category for template
  getAllergensByCategory(category: string) {
    return this.availableAllergens.filter(allergen => allergen.category === category);
  }

  // Custom Allergens
  addCustomAllergen() {
    if (this.newCustomAllergen.trim()) {
      const allergen = this.newCustomAllergen.trim();
      if (!this.userSettings.custom_allergens.includes(allergen)) {
        this.userSettings.custom_allergens.push(allergen);
        this.userSettings.selected_allergens.push(allergen);
        this.userSettings.severity_levels[allergen] = 'moderate';
        this.newCustomAllergen = '';
        this.showToast('Custom allergen added', 'success');
        this.saveUserSettings();
      } else {
        this.showToast('Allergen already exists', 'warning');
      }
    }
  }

  removeCustomAllergen(allergen: string) {
    const index = this.userSettings.custom_allergens.indexOf(allergen);
    if (index > -1) {
      this.userSettings.custom_allergens.splice(index, 1);
      this.toggleAllergen(allergen); // Remove from selected as well
      this.showToast('Custom allergen removed', 'success');
      this.saveUserSettings();
    }
  }

  // Dietary Restrictions
  toggleDietaryRestriction(restriction: string) {
    const index = this.userSettings.dietary_restrictions.indexOf(restriction);
    if (index > -1) {
      this.userSettings.dietary_restrictions.splice(index, 1);
    } else {
      this.userSettings.dietary_restrictions.push(restriction);
    }
    this.saveUserSettings();
  }

  isDietaryRestrictionSelected(restriction: string): boolean {
    return this.userSettings.dietary_restrictions.includes(restriction);
  }

  // Emergency Information
  async updateEmergencyInfo() {
    const alert = await this.alertController.create({
      header: 'Emergency Information',
      message: 'Add emergency contact and medical notes for severe allergic reactions',
      inputs: [
        {
          name: 'emergencyContact',
          type: 'text',
          placeholder: 'Emergency Contact Number',
          value: this.userSettings.emergency_contact || ''
        },
        {
          name: 'medicalNotes',
          type: 'textarea',
          placeholder: 'Medical Notes (medications, conditions, etc.)',
          value: this.userSettings.medical_notes || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            this.userSettings.emergency_contact = data.emergencyContact;
            this.userSettings.medical_notes = data.medicalNotes;
            this.saveUserSettings();
            this.showToast('Emergency information updated', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Settings Management
  async exportSettings() {
    const settingsData = JSON.stringify(this.userSettings, null, 2);
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'allergen-profile.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Settings exported successfully', 'success');
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedSettings = JSON.parse(e.target.result);
            this.userSettings = { ...this.userSettings, ...importedSettings };
            this.saveUserSettings();
            this.showToast('Settings imported successfully', 'success');
          } catch (error) {
            this.showToast('Invalid file format', 'danger');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  resetAllSettings() {
    this.userSettings = {
      selected_allergens: [],
      severity_levels: {},
      custom_allergens: [],
      dietary_restrictions: [],
      auto_scan: true,
      alert_level: 'medium'
    };
    this.saveUserSettings();
    this.showToast('All settings reset', 'success');
  }

  // Utility Methods
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // Missing methods from template
  saveSettings() {
    this.saveUserSettings();
    this.showToast('Settings saved successfully', 'success');
  }

  getSelectedCount(): number {
    return this.userSettings.selected_allergens.length;
  }

  getSevereAllergensCount(): number {
    return Object.values(this.userSettings.severity_levels).filter(level => level === 'severe').length;
  }

  updateSeverity(allergenName: string, severity: 'mild' | 'moderate' | 'severe') {
    this.userSettings.severity_levels[allergenName] = severity;
    this.saveUserSettings();
  }

  testAllergenDetection() {
    // Simulate allergen detection test
    const testMeal = {
      name: 'Test Meal',
      ingredients: ['peanuts', 'milk', 'eggs']
    };
    
    const detectedAllergens = testMeal.ingredients.filter(ingredient => 
      this.userSettings.selected_allergens.some(allergen => 
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )
    );

    if (detectedAllergens.length > 0) {
      this.showToast(`Test: Found allergens: ${detectedAllergens.join(', ')}`, 'warning');
    } else {
      this.showToast('Test: No allergens detected', 'success');
    }
  }
}
