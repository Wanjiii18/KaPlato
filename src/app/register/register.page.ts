import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'karenderia_owner',
    // Business fields for Karenderia Owner
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    city: '',
    province: '',
    businessPhone: '',
    businessEmail: '',
    openingTime: '',
    closingTime: '',
    businessPermit: null as File | null
  };

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  async onRegister(form: NgForm) {
    if (form.valid && this.registerData.password === this.registerData.confirmPassword) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        if (this.registerData.role === 'customer') {
          // Regular customer registration
          const registerData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            role: this.registerData.role as 'customer' | 'karenderia_owner'
          };
          await this.authService.register(registerData).toPromise();
        } else {
          // Karenderia owner registration with business information
          const karenderiaData = {
            // User account data
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            
            // Business data
            business_name: this.registerData.business_name,
            description: this.registerData.description,
            address: this.registerData.address,
            city: this.registerData.city,
            province: this.registerData.province,
            phone: this.registerData.phone || null,
            business_email: this.registerData.business_email || null,
            opening_time: this.registerData.opening_time,
            closing_time: this.registerData.closing_time,
            operating_days: this.registerData.operating_days,
            delivery_fee: this.registerData.delivery_fee,
            delivery_time_minutes: this.registerData.delivery_time_minutes,
            accepts_cash: this.registerData.accepts_cash,
            accepts_online_payment: this.registerData.accepts_online_payment
          };
          await this.authService.registerKarenderiaOwner(karenderiaData).toPromise();
        }
        
        // Show success message
        if (this.registerData.role === 'customer') {
          this.successMessage = 'Registration successful! Please log in with your credentials.';
        } else {
          this.successMessage = 'Karenderia registration successful! Your application is pending admin approval. Please log in to access your account.';
        }
        
        // Clear form
        this.registerData = {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'customer',
          businessName: '',
          businessDescription: '',
          businessAddress: '',
          city: '',
          province: '',
          businessPhone: '',
          businessEmail: '',
          openingTime: '',
          closingTime: '',
          businessPermit: null
        };
        form.resetForm();
        
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Handle different error types
        if (error.error && error.error.errors) {
          // Validation errors from backend
          const firstError = Object.values(error.error.errors)[0];
          this.errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onBusinessPermitChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerData.businessPermit = file;
    }
  }

  openFileSelector() {
    const fileInput = document.getElementById('businessPermit') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Validation helper for karenderia business form
  isKarenderiaFormValid(): boolean {
    if (this.registerData.role !== 'karenderia_owner') {
      return true; // No additional validation needed for customers
    }

    return !!(
      this.registerData.business_name &&
      this.registerData.description && 
      this.registerData.description.length >= 10 &&
      this.registerData.address && 
      this.registerData.address.length >= 10 &&
      this.registerData.city &&
      this.registerData.province &&
      this.registerData.business_permit_file // Require business permit for registration
    );
  }

  // Upload business permit file
  uploadBusinessPermit(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        this.registerData.business_permit_file = file;
      }
    };
    input.click();
  }

  // Remove business permit file
  removeBusinessPermit(): void {
    this.registerData.business_permit_file = null;
  }
}
