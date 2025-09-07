import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  cuisineType: string;
  description: string;
  address: string;
  logo?: string;
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

@Component({
  selector: 'app-karenderia-settings',
  templateUrl: './karenderia-settings.page.html',
  styleUrls: ['./karenderia-settings.page.scss'],
  standalone: false,
})
export class KarenderiaSettingsPage implements OnInit {
  selectedTab: string = 'business';

  businessInfo: BusinessInfo = {
    name: "Lola Rosa's Kitchen",
    phone: '+63 912 345 6789',
    email: 'lolarosa@kitchen.com',
    cuisineType: 'filipino',
    description: 'Authentic Filipino home-cooked meals',
    address: '123 Rizal Street, Quezon City'
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

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadSettings();
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
  loadSettings() {
    // Load settings from backend or local storage
    console.log('Loading settings...');
  }

  saveChanges() {
    // Save all settings
    console.log('Saving changes...');
    console.log('Business Info:', this.businessInfo);
    console.log('Operations Settings:', this.operationsSettings);
    console.log('Notification Settings:', this.notificationSettings);
    console.log('Account Settings:', this.accountSettings);
    console.log('Operating Hours:', this.operatingHours);
    
    // Show success message
    this.showSuccessMessage();
  }

  uploadLogo() {
    // Implement logo upload functionality
    console.log('Uploading logo...');
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
}
