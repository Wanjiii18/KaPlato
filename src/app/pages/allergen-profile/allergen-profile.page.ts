import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { UserProfile, UserService } from '../../services/user.service';
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
  private isSyncing = false;
  private hasPendingSync = false;
  
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
    private alertController: AlertController,
    private authService: AuthService,
    private userService: UserService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadUserSettings();
  }
  
  async loadUserSettings() {
    const savedSettings = localStorage.getItem('allergen-settings');
    if (savedSettings) {
      try {
        this.userSettings = this.normalizeUserSettings(JSON.parse(savedSettings));
      } catch {
        // Ignore invalid local cache and rely on defaults/backend profile.
      }
    }

    if (this.authService.isAuthenticated()) {
      try {
        const profile = await firstValueFrom(this.userService.loadUserProfile());
        if (profile) {
          this.applyProfileSettings(profile);
          this.persistLocalSettings();
        }
      } catch {
        // Keep local settings fallback if profile load fails.
      }
    }
  }
  
  saveUserSettings() {
    this.persistLocalSettings();
    this.queueBackendSync();
  }

  private persistLocalSettings() {
    this.userSettings = this.normalizeUserSettings(this.userSettings);
    localStorage.setItem('allergen-settings', JSON.stringify(this.userSettings));
  }

  private toStringArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.map(item => String(item).trim()).filter(item => !!item);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(item => !!item);
    }

    if (value && typeof value === 'object') {
      return Object.values(value)
        .map(item => String(item).trim())
        .filter(item => !!item);
    }

    return [];
  }

  private normalizeUserSettings(raw: any): UserAllergenSettings {
    const selectedAllergens = this.toStringArray(raw?.selected_allergens);
    const customAllergens = this.toStringArray(raw?.custom_allergens);
    const dietaryRestrictions = this.toStringArray(raw?.dietary_restrictions);
    const severityLevels = (raw?.severity_levels && typeof raw.severity_levels === 'object')
      ? raw.severity_levels as { [key: string]: string }
      : {};

    return {
      selected_allergens: [...new Set(selectedAllergens)],
      severity_levels: severityLevels,
      custom_allergens: [...new Set(customAllergens)],
      dietary_restrictions: [...new Set(dietaryRestrictions)],
      auto_scan: typeof raw?.auto_scan === 'boolean' ? raw.auto_scan : true,
      alert_level: typeof raw?.alert_level === 'string' && raw.alert_level ? raw.alert_level : 'medium',
      emergency_contact: raw?.emergency_contact,
      medical_notes: raw?.medical_notes
    };
  }

  private applyProfileSettings(profile: UserProfile) {
    const profileAllergens = Array.isArray(profile.allergens) ? profile.allergens : [];
    const allergyNames = this.toStringArray(profile.allergies);
    const dietaryRestrictions = this.toStringArray(profile.dietaryRestrictions);

    const selected = profileAllergens.length > 0
      ? profileAllergens.map((allergen: any) => allergen.name).filter((name: string) => !!name)
      : allergyNames;

    const severityLevels: { [key: string]: string } = {};
    for (const allergen of profileAllergens) {
      if (allergen?.name) {
        severityLevels[allergen.name] = allergen.severity || 'moderate';
      }
    }

    for (const allergen of selected) {
      if (!severityLevels[allergen]) {
        severityLevels[allergen] = 'moderate';
      }
    }

    const predefinedAllergens = new Set(this.availableAllergens.map(item => item.name));
    const customAllergens = selected.filter(name => !predefinedAllergens.has(name));

    this.userSettings = {
      ...this.userSettings,
      selected_allergens: [...new Set(selected)],
      severity_levels: severityLevels,
      custom_allergens: [...new Set(customAllergens)],
      dietary_restrictions: dietaryRestrictions.length > 0
        ? [...new Set(dietaryRestrictions)]
        : this.toStringArray(this.userSettings.dietary_restrictions)
    };

    this.userSettings = this.normalizeUserSettings(this.userSettings);
  }

  private queueBackendSync() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (this.isSyncing) {
      this.hasPendingSync = true;
      return;
    }

    this.isSyncing = true;
    void this.syncSettingsToBackend().finally(() => {
      this.isSyncing = false;
      if (this.hasPendingSync) {
        this.hasPendingSync = false;
        this.queueBackendSync();
      }
    });
  }

  private getAllergenCategory(name: string): string {
    const predefined = this.availableAllergens.find(item => item.name === name);
    return predefined?.category || 'Custom';
  }

  private async syncSettingsToBackend() {
    this.userSettings = this.normalizeUserSettings(this.userSettings);

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return;
    }

    const selectedAllergens = this.toStringArray(this.userSettings.selected_allergens);
    const dietaryRestrictions = this.toStringArray(this.userSettings.dietary_restrictions);

    await firstValueFrom(this.userService.updateUserProfile({
      allergies: selectedAllergens,
      dietaryRestrictions: dietaryRestrictions
    }));

    const profile = this.userService.getCurrentUserProfile() || await firstValueFrom(this.userService.loadUserProfile());
    if (!profile) {
      return;
    }

    const existingAllergens = Array.isArray(profile.allergens) ? profile.allergens : [];
    const existingByName = new Map(
      existingAllergens
        .filter((item: any) => item?.name)
        .map((item: any) => [item.name, item])
    );

    for (const existing of existingAllergens) {
      if (!selectedAllergens.includes(existing.name) && existing.id) {
        await this.profileService.removeAllergen(currentUser.id, String(existing.id));
      }
    }

    for (const allergenName of selectedAllergens) {
      const desiredSeverity = this.userSettings.severity_levels[allergenName] || 'moderate';
      const existing = existingByName.get(allergenName);

      if (!existing) {
        await this.profileService.addAllergen(currentUser.id, {
          name: allergenName,
          category: this.getAllergenCategory(allergenName),
          severity: desiredSeverity as 'mild' | 'moderate' | 'severe'
        });
        continue;
      }

      if ((existing.severity || 'moderate') !== desiredSeverity && existing.id) {
        await this.profileService.removeAllergen(currentUser.id, String(existing.id));
        await this.profileService.addAllergen(currentUser.id, {
          name: allergenName,
          category: existing.category || this.getAllergenCategory(allergenName),
          severity: desiredSeverity as 'mild' | 'moderate' | 'severe'
        });
      }
    }

    await firstValueFrom(this.userService.loadUserProfile());
  }

  // Allergen Management
  toggleAllergen(allergenName: string) {
    this.userSettings.selected_allergens = this.toStringArray(this.userSettings.selected_allergens);
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
      case 'Animal Products': return 'restaurant-outline';
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
    this.userSettings.dietary_restrictions = this.toStringArray(this.userSettings.dietary_restrictions);
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
            this.userSettings = this.normalizeUserSettings({ ...this.userSettings, ...importedSettings });
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
  async saveSettings() {
    this.persistLocalSettings();

    if (!this.authService.isAuthenticated()) {
      this.showToast('Settings saved successfully', 'success');
      return;
    }

    try {
      await this.syncSettingsToBackend();
      this.showToast('Settings synced successfully', 'success');
    } catch (error: any) {
      const backendMessage = error?.error?.message || error?.message;
      this.showToast(backendMessage ? `Saved locally. Sync failed: ${backendMessage}` : 'Saved locally. Sync failed; please try again.', 'warning');
    }
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
