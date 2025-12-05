import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { KarenderiaService } from '../../services/karenderia.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  person,
  mail,
  business,
  storefront,
  location,
  map,
  call,
  time,
  cloudUpload,
  document,
  trash,
  lockClosed
} from 'ionicons/icons';

// Add icons
addIcons({ 
  person,
  mail,
  business,
  storefront,
  location,
  map,
  call,
  time,
  'cloud-upload': cloudUpload,
  document,
  trash,
  'lock-closed': lockClosed
});

@Component({
  selector: 'app-karenderia-registration',
  templateUrl: './karenderia-registration.page.html',
  styleUrls: ['./karenderia-registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class KarenderiaRegistrationPage implements OnInit {
  registerData = {
    username: '',
    email: '',
    role: 'Karenderia Owner', // Default to Karenderia Owner since this is the karenderia registration page
    password: '',
    confirmPassword: '',
    business_name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    business_email: '',
    opening_time: '',
    closing_time: '',
    business_permit_file: null as File | null
  };

  constructor(
    private router: Router,
    private karenderiaService: KarenderiaService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  onRoleChange(event: any) {
    console.log('Role changed to:', event.detail.value);
    console.log('Current registerData.role:', this.registerData.role);
    
    // Reset business-related fields when switching back to regular user
    if (event.detail.value !== 'Karenderia Owner') {
      this.registerData.business_name = '';
      this.registerData.description = '';
      this.registerData.address = '';
      this.registerData.city = '';
      this.registerData.province = '';
      this.registerData.phone = '';
      this.registerData.business_email = '';
      this.registerData.opening_time = '';
      this.registerData.closing_time = '';
      this.registerData.business_permit_file = null;
    }




  }

  uploadBusinessPermit() {
    // Create a file input element
    const fileInput = (window.document as Document).createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.registerData.business_permit_file = target.files[0];
      }
    };
    fileInput.click();
  }

  removeBusinessPermit() {
    this.registerData.business_permit_file = null;
  }

  async onRegister(form: any) {
    if (form.valid) {
      try {
        // Validate business fields before sending
        if (!this.registerData.business_name || this.registerData.business_name.trim().length === 0) {
          const alert = await this.alertController.create({
            header: 'Missing Information',
            message: 'Please enter your business name.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        if (!this.registerData.description || this.registerData.description.trim().length < 10) {
          const alert = await this.alertController.create({
            header: 'Missing Information',
            message: 'Please enter a business description (at least 10 characters).',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        if (!this.registerData.address || this.registerData.address.trim().length < 10) {
          const alert = await this.alertController.create({
            header: 'Missing Information',
            message: 'Please enter your complete business address (at least 10 characters).',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        if (!this.registerData.city || !this.registerData.province) {
          const alert = await this.alertController.create({
            header: 'Missing Information',
            message: 'Please enter your city and province.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        // Map the form data to match the API expectations
        const karenderiaData = {
          name: this.registerData.username,
          email: this.registerData.email,
          password: this.registerData.password,
          password_confirmation: this.registerData.confirmPassword,
          business_name: this.registerData.business_name,
          description: this.registerData.description,
          address: this.registerData.address,
          city: this.registerData.city,
          province: this.registerData.province,
          phone: this.registerData.phone,
          business_email: this.registerData.business_email,
          opening_time: this.registerData.opening_time,
          closing_time: this.registerData.closing_time
        };
        
        console.log('📤 Registering karenderia owner:', karenderiaData);
        
        // Call the karenderia owner registration API
        const response = await this.authService.registerKarenderiaOwner(karenderiaData).toPromise();
        
        // Show success alert with approval message
        const alert = await this.alertController.create({
          header: '✅ Registration Successful!',
          message: response?.message || 'Your karenderia application has been submitted and is now pending admin approval. You will be able to login once an admin approves your application.',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                // Redirect to login page
                this.router.navigate(['/login']);
              }
            }
          ]
        });
        await alert.present();
        
      } catch (error: any) {
        console.error('❌ Registration error:', error);
        console.error('❌ Error details:', error.error);
        
        let errorMessage = 'An error occurred during registration. Please try again.';
        
        // Check if there are validation errors from the server
        if (error.error && error.error.errors) {
          console.error('❌ Validation errors:', error.error.errors);
          
          // Format validation errors for display
          const errorList = Object.entries(error.error.errors)
            .map(([field, messages]: [string, any]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            })
            .join('\n');
          
          errorMessage = `Please fix the following errors:\n\n${errorList}`;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        const alert = await this.alertController.create({
          header: 'Registration Failed',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    } else {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}