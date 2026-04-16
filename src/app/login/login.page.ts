import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { KarenderiaInfoService } from '../services/karenderia-info.service';
import { UserService } from '../services/user.service';

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
    private router: Router,
    private karenderiaInfoService: KarenderiaInfoService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.role === 'karenderia_owner') {
        try {
          const profile = await this.userService.loadUserProfile().toPromise();
          const status = (profile?.applicationStatus || '').toLowerCase();

          if (status === 'rejected' || status === 'pending') {
            this.router.navigate(['/karenderia-settings']);
            return;
          }
        } catch (error) {
          console.warn('Could not verify owner status before redirect:', error);
        }
      }

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
      case 'supplier':
        this.router.navigate(['/inventory-management']);
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
        
        // If it's a karenderia owner, load their karenderia data
        if (response?.user?.role === 'karenderia_owner') {
          console.log('🏪 Karenderia owner logged in, loading karenderia data...');
          await this.karenderiaInfoService.reloadKarenderiaData();
        }
        
        // Add a small delay to ensure session storage is set
        await new Promise(resolve => setTimeout(resolve, 100));

        const profile = await this.userService.loadUserProfile().toPromise();
        const status = (profile?.applicationStatus || response?.karenderia?.status || '').toLowerCase();
        
        // Redirect based on user role
        if (response?.user?.role === 'karenderia_owner' && (status === 'pending' || status === 'rejected')) {
          await this.router.navigate(['/karenderia-settings']);
        } else if (response?.user) {
          this.redirectBasedOnRole(response.user);
        } else {
          this.router.navigate(['/home']);
        }
        
      } catch (error: any) {
        if (error?.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error?.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }
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
