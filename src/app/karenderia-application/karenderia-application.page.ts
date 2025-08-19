import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ApplicationService, KarenderiaApplication } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { UserService, UserProfile } from '../services/user.service';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-karenderia-application',
  templateUrl: './karenderia-application.page.html',
  styleUrls: ['./karenderia-application.page.scss'],
  standalone: false,
})
export class KarenderiaApplicationPage implements OnInit {
  applicationData = {
    businessName: '',
    businessAddress: '',
    contactNumber: '',
    businessPermitNumber: '',
    ownerName: '',
    description: '',
    cuisine: [] as string[],
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' }
    } as { [key: string]: { open: string; close: string } },
    socialMediaLinks: {
      facebook: '',
      instagram: ''
    },
    estimatedCapacity: 0,
    priceRange: 'Budget' as 'Budget' | 'Moderate' | 'Expensive'
  };

  businessPermitFile: File | null = null;
  currentUser: UserProfile | null = null;
  existingApplications: KarenderiaApplication[] = [];
  isLoading = false;
  errorMessage = '';

  availableCuisines = [
    'Filipino', 'Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese',
    'American', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'Fusion'
  ];

  daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private userService: UserService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadExistingApplications();
  }

  async loadCurrentUser() {
    this.currentUser = this.userService.getCurrentUserProfile();
    if (this.currentUser) {
      this.applicationData.ownerName = this.currentUser.displayName;
      this.applicationData.contactNumber = this.currentUser.phoneNumber || '';
    }
  }

  async loadExistingApplications() {
    if (!this.currentUser) return;

    this.applicationService.getApplicationsByApplicant(this.currentUser.uid).subscribe({
      next: (applications) => {
        this.existingApplications = applications;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select an image file for business permit', 'warning');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size must be less than 5MB', 'warning');
        return;
      }

      this.businessPermitFile = file;
    }
  }

  onCuisineChange(cuisine: string, event: any) {
    if (event.detail.checked) {
      if (!this.applicationData.cuisine.includes(cuisine)) {
        this.applicationData.cuisine.push(cuisine);
      }
    } else {
      const index = this.applicationData.cuisine.indexOf(cuisine);
      if (index > -1) {
        this.applicationData.cuisine.splice(index, 1);
      }
    }
  }

  async onSubmitApplication(form: NgForm) {
    if (!form.valid || !this.businessPermitFile || !this.currentUser) {
      this.errorMessage = 'Please fill in all required fields and upload business permit';
      return;
    }

    if (this.applicationData.cuisine.length === 0) {
      this.errorMessage = 'Please select at least one cuisine type';
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Submitting application...'
    });
    await loading.present();

    try {
      const applicationData = {
        applicantId: this.currentUser.uid,
        applicationStatus: 'pending' as const,
        businessPermitImageUrl: '', // Will be set by the service when file is uploaded
        ...this.applicationData
      };

      const applicationId = await this.applicationService.submitApplication(
        applicationData,
        this.businessPermitFile
      );

      await loading.dismiss();
      await this.showToast('Application submitted successfully!', 'success');
      
      // Refresh applications
      this.loadExistingApplications();
      
      // Reset form
      this.resetForm();
      
    } catch (error: any) {
      await loading.dismiss();
      this.errorMessage = error.message || 'Error submitting application';
      console.error('Error submitting application:', error);
    }
  }

  resetForm() {
    this.applicationData = {
      businessName: '',
      businessAddress: '',
      contactNumber: this.currentUser?.phoneNumber || '',
      businessPermitNumber: '',
      ownerName: this.currentUser?.displayName || '',
      description: '',
      cuisine: [],
      operatingHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '20:00' }
      } as { [key: string]: { open: string; close: string } },
      socialMediaLinks: {
        facebook: '',
        instagram: ''
      },
      estimatedCapacity: 0,
      priceRange: 'Budget' as 'Budget' | 'Moderate' | 'Expensive'
    };
    this.businessPermitFile = null;
    this.errorMessage = '';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  }

  async showApplicationDetails(application: KarenderiaApplication) {
    const alert = await this.alertController.create({
      header: 'Application Details',
      subHeader: application.businessName,
      message: `
        <p><strong>Status:</strong> ${application.applicationStatus.toUpperCase()}</p>
        <p><strong>Submitted:</strong> ${application.submittedAt.toLocaleDateString()}</p>
        ${application.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${application.rejectionReason}</p>` : ''}
        ${application.adminNotes ? `<p><strong>Admin Notes:</strong> ${application.adminNotes}</p>` : ''}
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  // Add missing method
  showHelp() {
    console.log('Show help');
  }
}
