import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonInput, IonButton, IonIcon, IonTextarea, IonCheckbox, 
  IonLabel, LoadingController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { firstValueFrom } from 'rxjs';
import { 
  personAddOutline, restaurantOutline, locationOutline, arrowForward,
  arrowBack, informationCircleOutline, locate, search, send, 
  checkmarkCircle, speedometer, home, refresh
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

declare var google: any;
declare var window: any;

@Component({
  selector: 'app-karenderia-owner-registration',
  templateUrl: './karenderia-owner-registration.page.html',
  styleUrls: ['./karenderia-owner-registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonButton, IonIcon, IonTextarea, IonCheckbox, 
    IonLabel
  ]
})
export class KarenderiaOwnerRegistrationPage implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  currentStep = 1;
  accountForm!: FormGroup;
  businessForm!: FormGroup;
  locationForm!: FormGroup;
  
  isLoading = false;
  isSubmitting = false;
  isGettingLocation = false;
  
  map: any;
  marker: any;
  selectedLocation = { lat: 0, lng: 0 };
  selectedDays: string[] = [];
  businessPermitFile: File | null = null;
  permitFileError = '';
  
  weekDays = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    addIcons({
      personAddOutline,
      restaurantOutline,
      locationOutline,
      arrowForward,
      arrowBack,
      informationCircleOutline,
      locate,
      search,
      send,
      checkmarkCircle,
      speedometer,
      home,
      refresh
    });
  }

  ngOnInit() {
    this.initializeForms();
  }

  ionViewDidEnter() {
    // No-op: retained lifecycle hook for future enhancements.
  }

  initializeForms() {
    // Step 1: Account Form
    this.accountForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });

    // Step 2: Business Form
    this.businessForm = this.formBuilder.group({
      business_name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      phone: [''],
      business_email: ['', [Validators.email]],
      opening_time: ['09:00'],
      closing_time: ['21:00']
    });

    // Step 3: Location Form (simplified - no map required)
    this.locationForm = this.formBuilder.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      province: ['', [Validators.required, Validators.minLength(2)]],
      delivery_fee: [25, [Validators.min(0)]],
      delivery_time_minutes: [30, [Validators.min(0)]],
      accepts_cash: [true],
      accepts_online_payment: [false]
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

  nextStep() {
    if (this.currentStep === 1 && this.accountForm.valid) {
      this.currentStep = 2;
      return;
    } else if (this.currentStep === 2 && this.businessForm.valid) {
      if (!this.businessPermitFile) {
        this.permitFileError = 'Please upload your business permit (image or PDF).';
        this.showToast(this.permitFileError, 'warning');
        return;
      }

      this.permitFileError = '';
      this.currentStep = 3;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  toggleDay(day: string) {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }
  }

  onBusinessPermitSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.businessPermitFile = null;
      this.permitFileError = 'Only JPG, PNG, or PDF files are allowed.';
      input.value = '';
      return;
    }

    if (file.size > maxFileSize) {
      this.businessPermitFile = null;
      this.permitFileError = 'File size must be 5MB or less.';
      input.value = '';
      return;
    }

    this.businessPermitFile = file;
    this.permitFileError = '';
  }

  removeBusinessPermit(fileInput: HTMLInputElement) {
    this.businessPermitFile = null;
    this.permitFileError = '';
    fileInput.value = '';
  }

  loadMap() {
    // Check if Google Maps is loaded, if not wait and try again
    if (typeof google === 'undefined' || !window.googleMapsLoaded) {
      console.log('Google Maps not loaded yet, waiting...');
      setTimeout(() => {
        this.loadMap();
      }, 1000);
      return;
    }

    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not available');
      setTimeout(() => {
        this.loadMap();
      }, 500);
      return;
    }

    try {
      const mapOptions = {
        center: new google.maps.LatLng(14.5995, 120.9842), // Manila center
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'cooperative',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      };

      this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

      // Add draggable marker
      this.marker = new google.maps.Marker({
        position: mapOptions.center,
        map: this.map,
        draggable: true,
        title: 'Drag me to your restaurant location',
        animation: google.maps.Animation.BOUNCE
      });

      // Stop bounce animation after 2 seconds
      setTimeout(() => {
        this.marker.setAnimation(null);
      }, 2000);

      // Update coordinates when marker is dragged
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.ngZone.run(() => {
          this.selectedLocation = {
            lat: position.lat(),
            lng: position.lng()
          };
          console.log('Location updated:', this.selectedLocation);
        });
      });

      // Set initial location
      this.selectedLocation = {
        lat: mapOptions.center.lat(),
        lng: mapOptions.center.lng()
      };

      console.log('Google Maps loaded successfully');
      this.showToast('Map loaded! Drag the marker to your restaurant location.', 'success');
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      this.showToast('Error loading map. Please check your internet connection and try again.', 'danger');
    }
  }

  getCurrentLocation() {
    this.isGettingLocation = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          this.updateMapLocation(lat, lng);
          this.isGettingLocation = false;
        },
        (error) => {
          console.error('Error getting location:', error);
          this.showToast('Could not get your current location', 'warning');
          this.isGettingLocation = false;
        }
      );
    } else {
      this.showToast('Geolocation is not supported by this browser', 'warning');
      this.isGettingLocation = false;
    }
  }

  async searchLocation() {
    const alert = await this.alertCtrl.create({
      header: 'Search Location',
      inputs: [
        {
          name: 'address',
          type: 'text',
          placeholder: 'Enter address to search'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Search',
          handler: (data) => {
            if (data.address) {
              this.geocodeAddress(data.address);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  geocodeAddress(address: string) {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        this.updateMapLocation(location.lat(), location.lng());
        
        // Auto-fill address field
        this.locationForm.patchValue({
          address: results[0].formatted_address
        });
      } else {
        this.showToast('Address not found. Please try a different search.', 'warning');
      }
    });
  }

  updateMapLocation(lat: number, lng: number) {
    const position = new google.maps.LatLng(lat, lng);
    
    this.map.setCenter(position);
    this.marker.setPosition(position);
    
    this.selectedLocation = { lat, lng };
  }

  async submitApplication() {
    if (!this.businessPermitFile) {
      this.permitFileError = 'Please upload your business permit before submitting.';
      await this.showToast(this.permitFileError, 'warning');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Submitting your application...'
    });
    await loading.present();

    try {
      const registrationData = {
        ...this.accountForm.value,
        ...this.businessForm.value,
        ...this.locationForm.value,
        role: 'karenderia_owner',
        operating_days: this.selectedDays,
        status: 'pending',
        latitude: null,
        longitude: null
      };

      const formData = new FormData();
      Object.entries(registrationData).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          return;
        }

        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
          return;
        }

        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
          return;
        }

        formData.append(key, String(value));
      });

      formData.append('business_permit_file', this.businessPermitFile);

      await firstValueFrom(this.authService.registerKarenderiaOwner(formData));
      
      await loading.dismiss();
      this.currentStep = 4; // Success step
      
      await this.showToast('Application submitted successfully!', 'success');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
      
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
    
    this.isSubmitting = false;
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
