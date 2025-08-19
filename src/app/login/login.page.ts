import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  loginData = {
    emailOrUsername: '',
    password: ''
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  isLoginDisabled = false; // Added property to fix error

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUser();
      this.redirectBasedOnRole(currentUser);
    }
  }

  private redirectBasedOnRole(user: any) {
    console.log('Redirecting user with role:', user?.role);
    
    switch (user?.role) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'karenderia_owner':
        this.router.navigate(['/karenderia-dashboard']);
        break;
      case 'customer':
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  async onLogin(form: NgForm) {
    if (form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const credentials = { 
          email: this.loginData.emailOrUsername, 
          password: this.loginData.password 
        };
        const response = await this.authService.login(credentials).toPromise();
        
        // Redirect based on user role
        if (response?.user) {
          this.redirectBasedOnRole(response.user);
        } else {
          this.router.navigate(['/home']);
        }
        
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

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
