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
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.role === 'karenderia_owner') {
        this.router.navigate(['/karenderia-dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
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
        const response = await this.authService.register(registerData).toPromise();
        
        // Redirect based on user role
        if (response && response.user) {
          if (response.user.role === 'karenderia_owner') {
            this.router.navigate(['/karenderia-dashboard']);
          } else if (response.user.role === 'customer') {
            this.router.navigate(['/home']);
          } else {
            // Default redirect for unknown roles
            this.router.navigate(['/home']);
          }
        } else {
          this.router.navigate(['/home']);
        }
        
      } catch (error: any) {
        this.errorMessage = error.message || 'Registration failed. Please try again.';
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
