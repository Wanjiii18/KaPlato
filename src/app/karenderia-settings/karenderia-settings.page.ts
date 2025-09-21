import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { AdminService } from '../services/admin.service';
import { KarenderiaService } from '../services/karenderia.service';

interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  cuisineType: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
}

interface OperationsSettings {
  // Only operating hours-related settings for restaurant owners
  // Delivery and order management settings are handled by admin
}

interface NotificationSettings {
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

@Component({
  selector: 'app-karenderia-settings',
  templateUrl: './karenderia-settings.page.html',
  styleUrls: ['./karenderia-settings.page.scss'],
  standalone: false,
})
export class KarenderiaSettingsPage implements OnInit {
  selectedTab: string = 'business';
  isLoading: boolean = true;
  
  // Map modal properties
  showMapModal: boolean = false;
  pinPosition: { x: number | null, y: number | null } = { x: null, y: null };
  tempCoordinates: { lat: number | null, lng: number | null } = { lat: null, lng: null };

  businessInfo: BusinessInfo = {
    name: "Loading...",
    phone: 'Loading...',
    email: 'Loading...',
    cuisineType: 'filipino',
    description: 'Loading...',
    address: 'Loading...'
  };

  operationsSettings: OperationsSettings = {
    // Simplified operations settings - only operating hours
    // Delivery and order settings managed by admin
  };

  notificationSettings: NotificationSettings = {
    systemUpdates: true,
    promotionalEmails: false,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  };

  accountSettings: AccountSettings = {
    firstName: 'Rosa',
    lastName: 'Santos'
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

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private karenderiaInfoService: KarenderiaInfoService,
    private adminService: AdminService,
    private karenderiaService: KarenderiaService
  ) { }

  ngOnInit() {
    console.log('🔄 Settings page loading - Initializing karenderia data...');
    
    // Check for returned location from map picker
    this.route.queryParams.subscribe(params => {
      if (params['selectedLat'] && params['selectedLng']) {
        this.businessInfo.latitude = parseFloat(params['selectedLat']);
        this.businessInfo.longitude = parseFloat(params['selectedLng']);
        console.log('📍 Location received from map picker:', this.businessInfo.latitude, this.businessInfo.longitude);
        
        // Clear the query params
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
    
    // First, ensure the karenderia info service has loaded data
    this.karenderiaInfoService.loadKarenderiaData().then(() => {
      // Then load the settings
      this.loadSettings();
    });
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
    console.log('🔍 Loading karenderia settings from API...');
    this.isLoading = true;
    
    try {
      // Use the karenderia info service which has proper data loading logic
      const karenderiaData = this.karenderiaInfoService.getCurrentKarenderia();
      
      if (karenderiaData) {
        console.log('✅ Loading karenderia data from service:', karenderiaData);
        
        // Update business info with real data (cast to any to handle different property names)
        const data = karenderiaData as any;
        this.businessInfo = {
          name: data.business_name || data.name || 'Your Karenderia',
          phone: data.phone || '',
          email: data.business_email || data.email || '',
          cuisineType: 'filipino', // Default for now
          description: data.description || '',
          address: data.address || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null
        };
        
        console.log('📝 Updated business info:', this.businessInfo);
      } else {
        // Try to load from API directly
        console.log('🔄 No cached data, loading from API...');
        await this.loadFromAPI();
      }
      
      this.isLoading = false;
    } catch (error) {
      console.error('❌ Error loading karenderia settings:', error);
      this.setPlaceholderValues();
      this.isLoading = false;
    }
  }

  // Load directly from API if no cached data
  async loadFromAPI() {
    try {
      const response = await this.karenderiaService.getMyKarenderia().toPromise();
      console.log('🎯 API response:', response);
      
      if (response && response.success && response.data) {
        const karenderiaData = response.data;
        
        this.businessInfo = {
          name: karenderiaData.business_name || karenderiaData.name || 'Your Karenderia',
          phone: karenderiaData.phone || karenderiaData.contact_number || '',
          email: karenderiaData.business_email || karenderiaData.email || '',
          cuisineType: 'filipino',
          description: karenderiaData.description || '',
          address: karenderiaData.address || '',
          latitude: karenderiaData.latitude || null,
          longitude: karenderiaData.longitude || null
        };
        
        console.log('📝 Loaded from API:', this.businessInfo);
      } else {
        this.setPlaceholderValues();
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      this.setPlaceholderValues();
    }
  }

  private setPlaceholderValues() {
    console.log('⚠️ Setting placeholder values - please complete your business profile');
    this.businessInfo = {
      name: 'Your Business Name',
      phone: '',
      email: '',
      cuisineType: 'filipino',
      description: '',
      address: ''
    };
  }

  private getCurrentKarenderiaId(): number | null {
    // TODO: Get this from a service that tracks current user's karenderia
    // This is a placeholder implementation
    return null;
  }

  async saveChanges() {
    // Show confirmation dialog first
    const confirmed = confirm('Are you sure you want to save these changes?');
    if (!confirmed) {
      return;
    }

    try {
      console.log('Saving changes...');
      console.log('Business Info:', this.businessInfo);
      console.log('Location:', { 
        latitude: this.businessInfo.latitude, 
        longitude: this.businessInfo.longitude 
      });

      // Show loading state
      this.isLoading = true;

      // Prepare data for API
      const updateData = {
        business_name: this.businessInfo.name,
        phone: this.businessInfo.phone,
        business_email: this.businessInfo.email,
        description: this.businessInfo.description,
        address: this.businessInfo.address,
        latitude: this.businessInfo.latitude,
        longitude: this.businessInfo.longitude,
        cuisine_type: this.businessInfo.cuisineType
      };

      // Get current karenderia ID
      const currentKarenderia = this.karenderiaInfoService.getCurrentKarenderia();
      if (!currentKarenderia || !currentKarenderia.id) {
        throw new Error('No karenderia found to update');
      }

      // Call API to update karenderia data
      const response = await this.karenderiaService.updateKarenderiaData(
        parseInt(currentKarenderia.id), 
        updateData
      ).toPromise();

      console.log('✅ Save successful:', response);
      
      // Show success message
      this.showSuccessMessage();
      
      // Reload data to reflect changes
      await this.loadSettings();

    } catch (error) {
      console.error('❌ Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      this.isLoading = false;
    }
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
    // Show success alert
    alert('✅ Settings saved successfully!\n\nYour business information and location have been updated.');
    console.log('Settings saved successfully!');
  }

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
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

  // Location helper methods
  async getCurrentLocation(): Promise<void> {
    try {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.businessInfo.latitude = position.coords.latitude;
          this.businessInfo.longitude = position.coords.longitude;
          console.log('Location set:', this.businessInfo.latitude, this.businessInfo.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    } catch (error) {
      console.error('Error accessing geolocation:', error);
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

  // Close map modal
  closeMapModal() {
    this.showMapModal = false;
    this.pinPosition = { x: null, y: null };
    this.tempCoordinates = { lat: null, lng: null };
  }

  // Handle map click
  onMapClick(event: MouseEvent) {
    const mapElement = event.currentTarget as HTMLElement;
    const rect = mapElement.getBoundingClientRect();
    
    // Calculate click position relative to map
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel position to coordinates
    // Simple approximation: map spans from -180 to 180 lng, -90 to 90 lat
    const mapWidth = rect.width;
    const mapHeight = rect.height;
    
    const lng = ((x / mapWidth) * 360) - 180;
    const lat = 90 - ((y / mapHeight) * 180);
    
    this.tempCoordinates = { lat, lng };
    this.updatePinPosition();
  }

  // Update pin position based on coordinates
  updatePinPosition() {
    if (this.tempCoordinates.lat !== null && this.tempCoordinates.lng !== null) {
      // Convert coordinates to pixel position
      const mapElement = document.querySelector('.map-container') as HTMLElement;
      if (mapElement) {
        const mapWidth = mapElement.offsetWidth;
        const mapHeight = mapElement.offsetHeight;
        
        const x = ((this.tempCoordinates.lng + 180) / 360) * mapWidth;
        const y = ((90 - this.tempCoordinates.lat) / 180) * mapHeight;
        
        this.pinPosition = { x, y };
      }
    }
  }

  // Confirm map location
  confirmMapLocation() {
    if (this.tempCoordinates.lat !== null && this.tempCoordinates.lng !== null) {
      this.businessInfo.latitude = this.tempCoordinates.lat;
      this.businessInfo.longitude = this.tempCoordinates.lng;
      this.closeMapModal();
    }
  }

  // Use current location on map
  async useCurrentLocationOnMap() {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.tempCoordinates = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.updatePinPosition();
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Could not get your current location. Please try again or select manually.');
          }
        );
      } else {
        alert('Geolocation is not supported by this device.');
      }
    } catch (error) {
      console.error('Error accessing GPS:', error);
      alert('Could not access GPS. Please select location manually.');
    }
  }
}
