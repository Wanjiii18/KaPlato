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
    // Business fields for karenderia owners
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessDescription: ''
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

      // Additional validation for karenderia owners
      if (this.registerData.role === 'karenderia_owner') {
        if (!this.registerData.businessName || this.registerData.businessName.trim().length === 0) {
          this.errorMessage = 'Business name is required for karenderia owners';
          this.isLoading = false;
          return;
        }
        if (!this.registerData.businessAddress || this.registerData.businessAddress.trim().length < 10) {
          this.errorMessage = 'Business address must be at least 10 characters';
          this.isLoading = false;
          return;
        }
        if (!this.registerData.businessDescription || this.registerData.businessDescription.trim().length < 10) {
          this.errorMessage = 'Business description must be at least 10 characters';
          this.isLoading = false;
          return;
        }
      }

      try {
        if (this.registerData.role === 'karenderia_owner') {
          // Use karenderia owner registration with business details
          const karenderiaRegisterData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            business_name: this.registerData.businessName.trim(),
            address: this.registerData.businessAddress.trim(),
            phone: this.registerData.businessPhone,
            description: this.registerData.businessDescription.trim(),
            city: 'Cebu City', // Default for now
            province: 'Cebu', // Default for now
            delivery_fee: 25, // Default
            delivery_time_minutes: 30, // Default
            accepts_cash: true,
            accepts_online_payment: false
          };
          await this.authService.registerKarenderiaOwner(karenderiaRegisterData).toPromise();
        } else {
          // Regular customer registration
          const registerData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            role: this.registerData.role as 'customer' | 'karenderia_owner'
          };
          await this.authService.register(registerData).toPromise();
        }
        
        // Show success message
        this.successMessage = 'Registration successful! Please log in with your credentials.';
        
        // Clear form
        this.registerData = {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'customer',
          businessName: '',
          businessAddress: '',
          businessPhone: '',
          businessDescription: ''
        };
        form.resetForm();
        
      } catch (error: any) {
        console.error('Registration error:', error);
        
        // Handle 422 validation errors specifically
        if (error.status === 422 && error.error && error.error.errors) {
          const validationErrors = error.error.errors;
          const errorMessages = [];
          
          for (const field in validationErrors) {
            if (validationErrors[field]) {
              errorMessages.push(...validationErrors[field]);
            }
          }
          
          this.errorMessage = errorMessages.join(', ');
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
