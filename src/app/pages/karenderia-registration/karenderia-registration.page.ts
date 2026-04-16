import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { KarenderiaService } from '../../services/karenderia.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton, 
  IonContent, 
  IonIcon, 
  IonItem, 
  IonInput, 
  IonTextarea, 
  IonChip, 
  IonLabel, 
  IonButton, 
  IonCheckbox, 
  IonText 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  restaurantOutline, 
  informationCircleOutline, 
  callOutline, 
  locationOutline, 
  location, 
  locate, 
  timeOutline, 
  bicycleOutline, 
  cardOutline, 
  send, 
  informationCircle 
} from 'ionicons/icons';

declare var google: any;

// Add icons
addIcons({ 
  'restaurant-outline': restaurantOutline,
  'information-circle-outline': informationCircleOutline,
  'call-outline': callOutline,
  'location-outline': locationOutline,
  'location': location,
  'locate': locate,
  'time-outline': timeOutline,
  'bicycle-outline': bicycleOutline,
  'card-outline': cardOutline,
  'send': send,
  'information-circle': informationCircle
});

@Component({
  selector: 'app-karenderia-registration',
  templateUrl: './karenderia-registration.page.html',
  styleUrls: ['./karenderia-registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonItem,
    IonInput,
    IonTextarea,
    IonChip,
    IonLabel,
    IonButton,
    IonCheckbox,
    IonText
  ]
})
export class KarenderiaRegistrationPage implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  registrationForm!: FormGroup;
  isSubmitting = false;
  isGettingLocation = false;
  
  // Map related
  map: any;
  marker: any;
  selectedLocation = { lat: 10.3157, lng: 123.8854 }; // Default to Cebu City
  
  // Operating days
  weekDays = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];
  selectedDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private karenderiaService: KarenderiaService
  ) {
    this.initializeForm();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadGoogleMaps();
  }

  initializeForm() {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phone: [''],
      email: ['', [Validators.email]],
      opening_time: ['08:00'],
      closing_time: ['20:00'],
      delivery_fee: [25, [Validators.min(0)]],
      delivery_time_minutes: [30, [Validators.min(0)]],
      accepts_cash: [true],
      accepts_online_payment: [false]
    });
  }

  async loadGoogleMaps() {
    try {
      // Initialize map
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: this.selectedLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Add marker
      this.marker = new google.maps.Marker({
        position: this.selectedLocation,
        map: this.map,
        draggable: true,
        title: 'Your Restaurant Location'
      });

      // Listen for marker drag
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.selectedLocation = {
          lat: position.lat(),
          lng: position.lng()
        };
      });

      // Listen for map clicks
      this.map.addListener('click', (event: any) => {
        this.selectedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        this.marker.setPosition(this.selectedLocation);
      });

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      this.showToast('Error loading map. Please refresh the page.', 'danger');
    }
  }

  async getCurrentLocation() {
    this.isGettingLocation = true;
    try {
      const position = await Geolocation.getCurrentPosition();
      this.selectedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Update map and marker
      this.map.setCenter(this.selectedLocation);
      this.marker.setPosition(this.selectedLocation);
      
      this.showToast('Location updated successfully!', 'success');
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('Could not get current location. Please set manually on map.', 'warning');
    } finally {
      this.isGettingLocation = false;
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

  async onSubmit() {
    if (!this.registrationForm.valid) {
      this.showToast('Please fill in all required fields', 'danger');
      return;
    }

    if (!this.selectedLocation.lat || !this.selectedLocation.lng) {
      this.showToast('Please select your location on the map', 'danger');
      return;
    }

    if (this.selectedDays.length === 0) {
      this.showToast('Please select at least one operating day', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting your application...'
    });
    await loading.present();

    this.isSubmitting = true;

    try {
      const formData = {
        ...this.registrationForm.value,
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng,
        operating_days: this.selectedDays
      };

      // TODO: Replace with actual API call
      const response = await this.submitKarenderiaApplication(formData);
      
      await loading.dismiss();
      
      if (response.success) {
        await this.showSuccessAlert();
        this.router.navigate(['/dashboard']); // Or wherever you want to redirect
      } else {
        this.showToast(response.message || 'Failed to submit application', 'danger');
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);
      this.showToast(error.message || 'Failed to submit application', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  async submitKarenderiaApplication(data: any): Promise<any> {
    try {
      const response = await this.karenderiaService.registerKarenderia(data).toPromise();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Application Submitted!',
      message: 'Your karenderia application has been submitted successfully. Our admin team will review your application and notify you once approved.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
