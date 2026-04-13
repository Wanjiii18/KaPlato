import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { KarenderiaService } from '../services/karenderia.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

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
  currentKarenderiaId: number | null = null;
  karenderiaStatus: 'approved' | 'pending' | 'rejected' | 'unknown' = 'unknown';
  rejectionReason = '';
  isSaving = false;

  businessInfo: BusinessInfo = {
    name: 'Loading...',
    phone: '',
    email: '',
    cuisineType: 'filipino',
    description: '',
    address: ''
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

  constructor(
    private router: Router,
    private karenderiaInfoService: KarenderiaInfoService,
    private karenderiaService: KarenderiaService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.loadSettings();
  }

  // Navigation methods
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  logout() {
    console.log('Logging out...');
    this.authService.logoutAndRedirect();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  // Settings methods
  async loadSettings() {
    console.log('Loading settings...');

    try {
      const response = await this.karenderiaService.getCurrentUserKarenderia().toPromise();
      if (response?.success && response?.data) {
        const karenderia = response.data;
        this.currentKarenderiaId = karenderia.id ?? null;
        this.karenderiaStatus = this.normalizeKarenderiaStatus(karenderia.status);
        this.rejectionReason = karenderia.rejection_reason || '';
        this.businessInfo = {
          name: karenderia.business_name || karenderia.name || 'My Karenderia',
          phone: karenderia.phone || '',
          email: karenderia.business_email || karenderia.email || '',
          cuisineType: 'filipino',
          description: karenderia.description || '',
          address: karenderia.address || ''
        };

        const ownerName = this.getKarenderiaDisplayName();
        const [firstName = '', ...rest] = ownerName.split(' ');
        this.accountSettings = {
          firstName,
          lastName: rest.join(' ')
        };
      }
    } catch (error) {
      console.error('Failed to load settings from backend:', error);
    }
  }

  async saveChanges() {
    if (this.isSaving) {
      return;
    }

    const loading = await this.loadingController.create({
      message: this.karenderiaStatus === 'rejected' ? 'Resubmitting application...' : 'Saving changes...'
    });

    await loading.present();
    this.isSaving = true;

    try {
      const operatingDays = this.operatingHours
        .filter(day => day.isOpen)
        .map(day => day.name.toLowerCase());

      const payload = {
        business_name: this.businessInfo.name,
        name: this.businessInfo.name,
        business_email: this.businessInfo.email,
        email: this.businessInfo.email,
        phone: this.businessInfo.phone,
        description: this.businessInfo.description,
        address: this.businessInfo.address,
        operating_days: operatingDays,
        status: this.karenderiaStatus === 'rejected' ? 'pending' : undefined
      };

      const response = await this.karenderiaService.updateCurrentUserKarenderia(payload).toPromise();
      if (response?.success && response?.data) {
        this.currentKarenderiaId = response.data.id ?? this.currentKarenderiaId;
        this.karenderiaStatus = this.normalizeKarenderiaStatus(response.data.status || this.karenderiaStatus || 'unknown');
        this.rejectionReason = response.data.rejection_reason || '';
        this.karenderiaInfoService.updateKarenderiaData(response.data);
        await this.showToast(
          this.karenderiaStatus === 'pending'
            ? 'Application resubmitted successfully. Waiting for review.'
            : 'Settings saved successfully.',
          'success'
        );
      } else {
        await this.showToast('Unable to save changes.', 'warning');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      await this.showToast('Failed to save changes.', 'danger');
    } finally {
      this.isSaving = false;
      await loading.dismiss();
    }
  }

  private normalizeKarenderiaStatus(status: string | null | undefined): 'approved' | 'pending' | 'rejected' | 'unknown' {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'inactive') {
      return 'rejected';
    }

    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
      return normalized;
    }

    return 'unknown';
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

  getPrimaryActionLabel(): string {
    return this.karenderiaStatus === 'rejected' ? 'Resubmit Application' : 'Save Changes';
  }

  getStatusMessage(): string {
    if (this.karenderiaStatus === 'rejected') {
      return this.rejectionReason
        ? `Your application was rejected: ${this.rejectionReason}`
        : 'Your application was rejected. Update your details and resubmit for admin review.';
    }

    if (this.karenderiaStatus === 'pending') {
      return 'Your application is pending review. You can still update the details before approval.';
    }

    if (this.karenderiaStatus === 'approved') {
      return 'Your karenderia is approved and live.';
    }

    return 'Manage your karenderia details below.';
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  // Dynamic karenderia display methods
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }
}
