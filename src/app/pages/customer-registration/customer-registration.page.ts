import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonInput, IonButton, IonIcon, IonTextarea, IonCheckbox, 
  LoadingController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personAddOutline, personAdd, restaurant
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customer-registration',
  templateUrl: './customer-registration.page.html',
  styleUrls: ['./customer-registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonButton, IonIcon, IonTextarea, IonCheckbox
  ]
})
export class CustomerRegistrationPage implements OnInit {
  customerForm!: FormGroup;
  isRegistering = false;
  
  selectedDietaryPrefs: string[] = [];
  selectedCuisines: string[] = [];
  
  dietaryPreferences = [
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Pescatarian', value: 'pescatarian' },
    { label: 'Gluten-Free', value: 'gluten_free' },
    { label: 'Dairy-Free', value: 'dairy_free' },
    { label: 'Low-Carb', value: 'low_carb' },
    { label: 'Keto', value: 'keto' },
    { label: 'Halal', value: 'halal' }
  ];
  
  cuisinePreferences = [
    { label: 'Filipino', value: 'filipino' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Korean', value: 'korean' },
    { label: 'Italian', value: 'italian' },
    { label: 'Mexican', value: 'mexican' },
    { label: 'Thai', value: 'thai' },
    { label: 'Indian', value: 'indian' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personAddOutline,
      personAdd,
      restaurant
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.customerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      phone: [''],
      address: ['']
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleDietaryPreference(preference: string) {
    const index = this.selectedDietaryPrefs.indexOf(preference);
    if (index > -1) {
      this.selectedDietaryPrefs.splice(index, 1);
    } else {
      this.selectedDietaryPrefs.push(preference);
    }
  }

  toggleCuisinePreference(cuisine: string) {
    const index = this.selectedCuisines.indexOf(cuisine);
    if (index > -1) {
      this.selectedCuisines.splice(index, 1);
    } else {
      this.selectedCuisines.push(cuisine);
    }
  }

  async registerCustomer() {
    if (!this.customerForm.valid) {
      await this.showToast('Please fill in all required fields correctly', 'warning');
      return;
    }

    this.isRegistering = true;
    const loading = await this.loadingCtrl.create({
      message: 'Creating your account...'
    });
    await loading.present();

    try {
      const registrationData = {
        ...this.customerForm.value,
        role: 'customer',
        dietary_restrictions: this.selectedDietaryPrefs,
        cuisine_preferences: this.selectedCuisines
      };

      console.log('Customer registration data:', registrationData);

      await this.authService.register(registrationData).toPromise();
      
      await loading.dismiss();
      await this.showToast('Account created successfully! Welcome to KaPlato!', 'success');
      
      // Navigate to home since customers are auto-logged in
      this.router.navigate(['/home']);
      
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        errorMessage = Object.values(error.error.errors).flat().join('\n');
      }
      
      await this.showAlert('Registration Failed', errorMessage);
    }
    
    this.isRegistering = false;
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
