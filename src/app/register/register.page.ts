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
    role: 'customer' as 'customer' | 'karenderia_owner'
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
        const registerData = {
          name: this.registerData.username,
          email: this.registerData.email,
          password: this.registerData.password,
          password_confirmation: this.registerData.confirmPassword,
          role: this.registerData.role as 'customer' | 'karenderia_owner'
        };
        await this.authService.register(registerData).toPromise();
        
        // Show success message
        this.successMessage = 'Registration successful! Please log in with your credentials.';
        
        // Clear form
        this.registerData = {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'customer'
        };
        form.resetForm();
        
      } catch (error: any) {
        this.errorMessage = error.message;
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
