import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { KarenderiaService } from '../services/karenderia.service';
import { AdminService } from '../services/admin.service';
import { Geolocation } from '@capacitor/geolocation';

interface BusinessInfo {
  id?: number;
  name: string;
  business_name?: string;
  description: string;
  address: string;
  city?: string;
  province?: string;
  phone: string;
  email: string;
  business_email?: string;
  latitude?: number;
  longitude?: number;
  opening_time?: string;
  closing_time?: string;
  operating_days?: string[];
  status?: string;
  logo_url?: string;
  images?: string[];
  average_rating?: number;
  total_reviews?: number;
  delivery_fee?: number;
  delivery_time_minutes?: number;
  accepts_cash?: boolean;
  accepts_online_payment?: boolean;
  cuisineType?: string; // Frontend field for food specialty
  logo?: string; // For backward compatibility
}

interface OperationsSettings {
  // Only operating hours-related settings for restaurant owners
  // Delivery and order management settings are handled by admin
}

interface NotificationSettings {
  newOrders: boolean;
  orderCancellations: boolean;
  paymentReceived: boolean;
  systemUpdates: boolean;
  promotionalEmails: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface AccountSettings {
  firstName: string;
  lastName: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface OperatingDay {
  name: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface PinPosition {
  x: number | null;
  y: number | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-karenderia-settings',
  templateUrl: './karenderia-settings.page.html',
  styleUrls: ['./karenderia-settings.page.scss'],
  standalone: false,
})
export class KarenderiaSettingsPage implements OnInit {
  selectedTab: string = 'business';

  businessInfo: BusinessInfo = {
    name: '',
    phone: '',
    email: '',
    cuisineType: 'filipino',
    description: '',
    address: '',
    latitude: undefined,
    longitude: undefined
  };

  operationsSettings: OperationsSettings = {
    // Simplified operations settings - only operating hours
    // Delivery and order settings managed by admin
  };

  notificationSettings: NotificationSettings = {
    newOrders: true,
    orderCancellations: true,
    paymentReceived: true,
    systemUpdates: true,
    promotionalEmails: false,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  };

  accountSettings: AccountSettings = {
    firstName: '',
    lastName: ''
  };

  passwordChange: PasswordChange = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  operatingHours: OperatingDay[] = [
    { name: 'Monday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { name: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { name: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { name: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { name: 'Friday', isOpen: true, openTime: '08:00', closeTime: '21:00' },
    { name: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { name: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
  ];

  // Map modal properties
  showMapModal = false;
  pinPosition: PinPosition = { x: null, y: null };
  tempCoordinates: Coordinates = { lat: 0, lng: 0 };

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private alertController: AlertController,
    private karenderiaInfoService: KarenderiaInfoService,
    private karenderiaService: KarenderiaService,
    private adminService: AdminService
  ) { }

  ngOnInit() {
    // Check for returned location data from map picker
    this.route.queryParams.subscribe(params => {
      if (params['selectedLat'] && params['selectedLng']) {
        const lat = parseFloat(params['selectedLat']);
        const lng = parseFloat(params['selectedLng']);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          this.businessInfo.latitude = lat;
          this.businessInfo.longitude = lng;
          
          // Clear the query parameters to avoid re-processing
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }
      }
    });
    this.loadKarenderiaData();
  }

  // Load karenderia data from database
  loadKarenderiaData() {
    this.karenderiaService.getMyKarenderia().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          this.businessInfo = {
            id: data.id,
            name: data.name || '',
            business_name: data.business_name,
            description: data.description || '',
            address: data.address || '',
            city: data.city,
            province: data.province,
            phone: data.phone || '',
            email: data.email || '',
            business_email: data.business_email,
            latitude: data.latitude,
            longitude: data.longitude,
            opening_time: data.opening_time,
            closing_time: data.closing_time,
            operating_days: data.operating_days || [],
            status: data.status,
            logo_url: data.logo_url,
            images: data.images || [],
            average_rating: data.average_rating,
            total_reviews: data.total_reviews,
            delivery_fee: data.delivery_fee,
            delivery_time_minutes: data.delivery_time_minutes,
            accepts_cash: data.accepts_cash,
            accepts_online_payment: data.accepts_online_payment,
            cuisineType: 'filipino' // Default value
          };
          
          // Update operating hours if available
          if (data.operating_days && data.operating_days.length > 0) {
            this.updateOperatingHours(data.operating_days, data.opening_time, data.closing_time);
          }
          
          console.log('Karenderia data loaded successfully');
        } else {
          console.log('No karenderia data found - new registration');
        }
      },
      error: (error) => {
        console.error('Error loading karenderia data:', error);
        if (error.status === 404) {
          console.log('No karenderia found for this user - showing empty form for new registration');
        } else {
          console.error('Unexpected error:', error);
        }
        // Keep default empty values if error occurs
      }
    });
  }

  // Update operating hours based on backend data
  updateOperatingHours(operatingDays: string[], openTime?: string, closeTime?: string) {
    const daysMap: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };

    this.operatingHours.forEach(day => {
      const dayKey = day.name.toLowerCase();
      day.isOpen = operatingDays.includes(dayKey);
      if (day.isOpen && openTime && closeTime) {
        day.openTime = openTime;
        day.closeTime = closeTime;
      }
    });
  }

  // Save karenderia data to database
  saveSettings() {
    // Validate required fields
    if (!this.businessInfo.name || !this.businessInfo.name.trim()) {
      this.showValidationModal('Please enter your karenderia name.');
      return;
    }
    
    if (!this.businessInfo.phone || !this.businessInfo.phone.trim()) {
      this.showValidationModal('Please enter your contact number.');
      return;
    }
    
    if (!this.businessInfo.address || !this.businessInfo.address.trim()) {
      this.showValidationModal('Please enter your complete address.');
      return;
    }

    // Prepare data for backend
    const updateData = {
      name: this.businessInfo.name.trim(),
      description: this.businessInfo.description?.trim() || '',
      address: this.businessInfo.address.trim(),
      phone: this.businessInfo.phone.trim(),
      email: this.businessInfo.email?.trim() || '',
      latitude: this.businessInfo.latitude,
      longitude: this.businessInfo.longitude,
      // Convert operating hours back to backend format
      operating_days: this.operatingHours
        .filter(day => day.isOpen)
        .map(day => day.name.toLowerCase()),
      opening_time: this.operatingHours.find(day => day.isOpen)?.openTime || '08:00',
      closing_time: this.operatingHours.find(day => day.isOpen)?.closeTime || '20:00',
      accepts_cash: this.businessInfo.accepts_cash ?? true,
      accepts_online_payment: this.businessInfo.accepts_online_payment ?? false
    };

    console.log('Saving karenderia data:', updateData);

    if (this.businessInfo.id) {
      // Update existing karenderia
      this.karenderiaService.updateKarenderiaData(this.businessInfo.id, updateData).subscribe({
        next: (response) => {
          console.log('Update response:', response);
          if (response.success) {
            this.showSuccessModal('Settings saved successfully!');
            // Update the service with new data so the display name updates immediately
            this.karenderiaInfoService.loadKarenderiaData();
          } else {
            this.showErrorModal('Error saving settings: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error updating settings:', error);
          this.showErrorModal('Error saving settings: ' + (error.error?.message || error.message || 'Please try again.'));
        }
      });
    } else {
      // Register new karenderia
      this.karenderiaService.registerKarenderia(updateData).subscribe({
        next: (response) => {
          console.log('Registration response:', response);
          if (response.success) {
            this.businessInfo.id = response.data?.id;
            this.showSuccessModal('Karenderia registered successfully!');
            // Update the service with new data
            this.karenderiaInfoService.loadKarenderiaData();
          } else {
            this.showErrorModal('Error registering karenderia: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error registering karenderia:', error);
          this.showErrorModal('Error registering karenderia: ' + (error.error?.message || error.message || 'Please try again.'));
        }
      });
    }
  }

  // Navigation methods
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  logout() {
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  // Settings methods
  async loadSettings() {
    // Load settings from backend or local storage
    console.log('Loading settings...');
    
    try {
      // Load current karenderia verification status
      // Note: This would typically come from a service that gets the current user's karenderia
      // For now, we'll use a placeholder implementation
      const karenderiaId = this.getCurrentKarenderiaId();
      if (karenderiaId) {
        // TODO: Replace with actual API call to get karenderia details
        // const karenderiaDetails = await this.adminService.getKarenderiaById(karenderiaId).toPromise();
        // this.verificationStatus = karenderiaDetails.status as VerificationStatus;
        // this.verifiedAt = karenderiaDetails.approved_at ? new Date(karenderiaDetails.approved_at) : null;
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  }

  private getCurrentKarenderiaId(): number | null {
    // TODO: Get this from a service that tracks current user's karenderia
    // This is a placeholder implementation
    return null;
  }

  // Legacy method - now redirects to saveSettings
  saveChanges() {
    this.saveSettings();
  }

  changePassword() {
    if (this.passwordChange.newPassword !== this.passwordChange.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    
    if (this.passwordChange.newPassword.length < 6) {
      console.error('Password must be at least 6 characters');
      return;
    }

    console.log('Changing password...');
    // Implement password change logic
    
    // Clear form
    this.passwordChange = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  private showSuccessMessage() {
    // Implement success message display
    console.log('Settings saved successfully!');
  }

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    // Use the current form value if available, otherwise fallback to service
    if (this.businessInfo.name && this.businessInfo.name.trim()) {
      let displayName = this.businessInfo.name.trim();
      
      // Add "'s Kitchen" suffix if the name doesn't already have it
      if (!displayName.toLowerCase().includes('kitchen') && 
          !displayName.toLowerCase().includes('karenderia') &&
          !displayName.toLowerCase().includes('restaurant')) {
        // Check if it ends with 's already (like "Rosa's" -> "Rosa's Kitchen")
        if (displayName.endsWith("'s") || displayName.endsWith('s')) {
          displayName = displayName.endsWith("'s") ? displayName : displayName + "'s";
          displayName += " Kitchen";
        } else {
          displayName += "'s Kitchen";
        }
      }
      
      return displayName;
    }
    
    // Fallback to service if no form data
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    // Use the current form value if available
    if (this.businessInfo.name && this.businessInfo.name.trim()) {
      const name = this.businessInfo.name.trim();
      const words = name.split(' ').filter(word => word.length > 0);
      
      if (words.length === 0) return 'YK';
      if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
      
      // Take first letter of first two meaningful words (skip common words)
      const meaningfulWords = words.filter(word => 
        !['the', 'and', 'of', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with'].includes(word.toLowerCase())
      );
      
      if (meaningfulWords.length >= 2) {
        return (meaningfulWords[0][0] + meaningfulWords[1][0]).toUpperCase();
      } else if (meaningfulWords.length === 1) {
        return meaningfulWords[0].substring(0, 2).toUpperCase();
      }
      
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    
    // Fallback to service if no form data
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }

  // Logo and photo upload methods
  async uploadLogo(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Handle logo upload
        this.businessInfo.logo = file;
        console.log('Logo uploaded:', file.name);
      }
    };
    input.click();
  }

  async uploadBusinessPhoto(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (event: any) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        // Handle business photos upload
        console.log('Business photos uploaded:', files.length, 'files');
      }
    };
    input.click();
  }

  // Location methods
  async getCurrentLocation(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      this.businessInfo.latitude = position.coords.latitude;
      this.businessInfo.longitude = position.coords.longitude;
      
      console.log('Current location set:', this.businessInfo.latitude, this.businessInfo.longitude);
      
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }

    openMapPicker(): void {
    // Navigate to map view with location picker mode
    this.router.navigate(['/map-view'], { 
      queryParams: { 
        mode: 'location-picker',
        returnTo: 'karenderia-settings'
      }
    });
  }

  closeMapModal(): void {
    this.showMapModal = false;
    this.pinPosition = { x: null, y: null };
  }

  onMapClick(event: MouseEvent): void {
    const mapElement = event.currentTarget as HTMLElement;
    const rect = mapElement.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    this.pinPosition = { x, y };
    
    // Convert click position to approximate coordinates
    // This is a simplified conversion - in a real app, you'd use a proper map API
    const baseLat = 14.5995;
    const baseLng = 120.9842;
    const range = 0.1; // Approximate coordinate range
    
    this.tempCoordinates = {
      lat: baseLat + ((50 - y) / 100) * range,
      lng: baseLng + ((x - 50) / 100) * range
    };
  }

  async useCurrentLocationOnMap(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      this.tempCoordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Center the pin
      this.pinPosition = { x: 50, y: 50 };
      
    } catch (error) {
      console.error('Error getting location:', error);
      this.showErrorModal('Unable to get your current location.');
    }
  }

  confirmMapLocation(): void {
    if (this.tempCoordinates.lat && this.tempCoordinates.lng) {
      this.businessInfo.latitude = this.tempCoordinates.lat;
      this.businessInfo.longitude = this.tempCoordinates.lng;
      this.closeMapModal();
      
      console.log('Location confirmed:', this.businessInfo.latitude, this.businessInfo.longitude);
      this.showSuccessModal('Business location updated successfully!');
    }
  }

  // Modal helper methods
  private async showSuccessModal(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Success',
      message: message,
      buttons: ['OK'],
      cssClass: 'success-alert'
    });
    await alert.present();
  }

  private async showErrorModal(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
      cssClass: 'error-alert'
    });
    await alert.present();
  }

  private async showValidationModal(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Validation Error',
      message: message,
      buttons: ['OK'],
      cssClass: 'validation-alert'
    });
    await alert.present();
  }
}
