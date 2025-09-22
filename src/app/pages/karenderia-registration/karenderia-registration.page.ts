import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { KarenderiaService } from '../../services/karenderia.service';
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
    private karenderiaService: KarenderiaService
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

  onRegister(form: any) {
    if (form.valid) {
      // Implement registration logic here
      if (this.registerData.role === 'Karenderia Owner') {
        // Add karenderia owner registration logic
        console.log('Registering karenderia owner:', this.registerData);
      } else {
        // Add regular user registration logic
        console.log('Registering user:', this.registerData);
      }
    }
  }
}