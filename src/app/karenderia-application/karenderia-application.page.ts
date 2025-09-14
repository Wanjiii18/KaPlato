import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { 
  KarenderiaOwnerService, 
  RegistrationData, 
  MapCoordinates 
} from '../services/karenderia-owner.service';

@Component({
  selector: 'app-karenderia-application',
  templateUrl: './karenderia-application.page.html',
  styleUrls: ['./karenderia-application.page.scss'],
  standalone: false,
})
export class KarenderiaApplicationPage implements OnInit {
  registrationData: RegistrationData = {
    owner: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    karenderia: {
      name: '',
      description: '',
      address: '',
      latitude: 0,
      longitude: 0,
      phone: '',
      email: '',
      cuisine_type: 'Filipino',
      operating_days: [],
      opening_time: '08:00',
      closing_time: '20:00',
      delivery_available: true,
      pickup_available: true,
      delivery_fee: 0,
      minimum_order: 0
    },
    password: '',
    password_confirmation: ''
  };

  selectedCoordinates?: MapCoordinates;
  isLoading = false;
  errorMessage = '';
  currentStep = 1;
  totalSteps = 4;

  availableCuisines: string[] = [];
  daysOfWeek: string[] = [];

  constructor(
    private karenderiaOwnerService: KarenderiaOwnerService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.availableCuisines = this.karenderiaOwnerService.getCuisineTypes();
    this.daysOfWeek = this.karenderiaOwnerService.getDaysOfWeek();
    
    // Initialize operating_days with all days
    this.registrationData.karenderia.operating_days = [...this.daysOfWeek];
  }

  onCoordinatesSelected(coordinates: MapCoordinates) {
    this.selectedCoordinates = coordinates;
    this.registrationData.karenderia.latitude = coordinates.latitude;
    this.registrationData.karenderia.longitude = coordinates.longitude;
  }

  toggleOperatingDay(day: string) {
    const index = this.registrationData.karenderia.operating_days.indexOf(day);
    if (index > -1) {
      this.registrationData.karenderia.operating_days.splice(index, 1);
    } else {
      this.registrationData.karenderia.operating_days.push(day);
    }
  }

  isDaySelected(day: string): boolean {
    return this.registrationData.karenderia.operating_days.includes(day);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async onSubmitRegistration(form: NgForm) {
    if (!form.valid) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (!this.selectedCoordinates) {
      await this.showToast('Please select your karenderia location on the map', 'warning');
      return;
    }

    if (this.registrationData.password !== this.registrationData.password_confirmation) {
      await this.showToast('Passwords do not match', 'danger');
      return;
    }

    if (this.registrationData.karenderia.operating_days.length === 0) {
      await this.showToast('Please select at least one operating day', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting your application...'
    });
    await loading.present();

    try {
      const response = await this.karenderiaOwnerService.register(this.registrationData).toPromise();
      
      await loading.dismiss();
      
      if (response && response.message) {
        await this.showSuccessAlert();
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);
      
      let errorMsg = 'Registration failed. Please try again.';
      if (error.error && error.error.message) {
        errorMsg = error.error.message;
      } else if (error.error && error.error.errors) {
        // Handle validation errors
        const errors = Object.values(error.error.errors).flat();
        errorMsg = errors.join(', ');
      }
      
      await this.showToast(errorMsg, 'danger');
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Application Submitted!',
      message: 'Your karenderia application has been submitted successfully. You will receive an email notification once it has been reviewed by our admin team.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/home']);
          }
        }
      ]
    });
    await alert.present();
  }

  async showHelp() {
    const alert = await this.alertController.create({
      header: 'Application Help',
      message: `
        <p><strong>Step 1:</strong> Enter your personal information as the karenderia owner.</p>
        <p><strong>Step 2:</strong> Provide your karenderia business details.</p>
        <p><strong>Step 3:</strong> Set your location by clicking on the map.</p>
        <p><strong>Step 4:</strong> Configure operating hours and delivery options.</p>
        <br>
        <p>All applications are reviewed by our admin team within 24-48 hours.</p>
      `,
      buttons: ['Got it!']
    });
    await alert.present();
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Owner Information';
      case 2: return 'Business Details';
      case 3: return 'Location & Address';
      case 4: return 'Operations & Delivery';
      default: return 'Registration';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case 1: return 'Enter your personal details as the karenderia owner';
      case 2: return 'Provide information about your karenderia business';
      case 3: return 'Set your business location and address';
      case 4: return 'Configure operating hours and delivery options';
      default: return '';
    }
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.registrationData.owner.name && 
                  this.registrationData.owner.email && 
                  this.registrationData.owner.phone && 
                  this.registrationData.password && 
                  this.registrationData.password_confirmation);
      case 2:
        return !!(this.registrationData.karenderia.name && 
                  this.registrationData.karenderia.description && 
                  this.registrationData.karenderia.cuisine_type);
      case 3:
        return !!(this.registrationData.karenderia.address && 
                  this.selectedCoordinates);
      case 4:
        return this.registrationData.karenderia.operating_days.length > 0;
      default:
        return false;
    }
  }
}
