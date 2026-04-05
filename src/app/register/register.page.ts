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
    accountType: 'customer' as 'customer' | 'supplier',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
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
        if (this.registerData.accountType === 'supplier') {
          const supplierData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            phone_number: this.registerData.phoneNumber || undefined,
            address: this.registerData.address || undefined,
          };

          await this.authService.registerSupplier(supplierData).toPromise();
          this.successMessage = 'Supplier registration submitted. Please wait for admin approval before logging in.';
        } else {
          const customerData = {
            name: this.registerData.username,
            email: this.registerData.email,
            password: this.registerData.password,
            password_confirmation: this.registerData.confirmPassword,
            role: 'customer' as 'customer'
          };

          await this.authService.register(customerData).toPromise();
          this.successMessage = 'Registration successful! Please log in with your credentials.';
        }
        
        // Clear form
        this.registerData = {
          accountType: 'customer',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          address: ''
        };
        form.resetForm();
        
      } catch (error: any) {
        console.error('Registration error:', error);
        // Display server error messages
        if (error.error && error.error.errors) {
          const errors = Object.values(error.error.errors).flat();
          this.errorMessage = errors.join(' ');
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    } else if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
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
  
  goToKarenderiaRegistration() {
    this.router.navigate(['/karenderia-registration']);
  }
}
