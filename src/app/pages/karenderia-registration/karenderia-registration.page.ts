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
    role: '',
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
        if (this.registerData.role === 'Karenderia Owner') {
          console.log('Registering karenderia owner:', this.registerData);
          
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
          
          // Call the karenderia owner registration API
          const response = await this.authService.registerKarenderiaOwner(karenderiaData).toPromise();
          
          if (response && response.status === 'pending_approval') {
            // Show success alert with approval message
            const alert = await this.alertController.create({
              header: '✅ Registration Successful!',
              message: response.message || 'Your karenderia application has been submitted and is now pending admin approval. You will be able to login once an admin approves your application.',
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
          } else if (response) {
            // Handle unexpected response
            const alert = await this.alertController.create({
              header: 'Registration Complete',
              message: response.message || 'Registration completed successfully.',
              buttons: ['OK']
            });
            await alert.present();
          }
        } else {
          // Regular user registration
          console.log('Registering regular user:', this.registerData);
          
          // Map the form data to match the API expectations
          const userData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            role: 'customer' as 'customer'
          };
          
          const response = await this.authService.register(userData).toPromise();
          
          const alert = await this.alertController.create({
            header: 'Registration Successful',
            message: 'Your account has been created successfully!',
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.router.navigate(['/login']);
                }
              }
            ]
          });
          await alert.present();
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        
        const alert = await this.alertController.create({
          header: 'Registration Failed',
          message: error.error?.message || 'An error occurred during registration. Please try again.',
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
}