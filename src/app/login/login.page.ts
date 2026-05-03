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
  ownerVerificationMessage = '';
  ownerVerificationStatus: 'pending_approval' | 'rejected' | '' = '';
  verificationRole: 'owner' | 'supplier' | '' = '';
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
        // Suppliers go to inventory management for stock and inventory
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
      this.ownerVerificationMessage = '';
      this.ownerVerificationStatus = '';

      try {
        const credentials = { 
          email: this.loginData.emailOrUsername, 
          password: this.loginData.password 
        };
        const response = await this.authService.login(credentials).toPromise();
        
        console.log('🔑 Login successful, user role:', response?.user?.role);
        
        // If it's a karenderia owner, load their karenderia data
        if (response?.user?.role === 'karenderia_owner') {
          console.log('🏪 Karenderia owner logged in, loading karenderia data...');
          await this.karenderiaInfoService.reloadKarenderiaData();
        }
        
        // Add a small delay to ensure session storage and BehaviorSubject are fully updated
        await new Promise(resolve => setTimeout(resolve, 200));

        const profile = await this.userService.loadUserProfile().toPromise();
        const status = (profile?.applicationStatus || response?.karenderia?.status || '').toLowerCase();

        console.log('📊 User profile loaded, status:', status, 'role:', response?.user?.role);

        // Redirect based on user role
        if (response?.user?.role === 'karenderia_owner' && (status === 'pending' || status === 'rejected')) {
          console.log('⏳ Karenderia owner status is', status, '- redirecting to settings');
          await this.router.navigate(['/karenderia-settings']);
        } else if (response?.user) {
          console.log('✅ Redirecting user with role:', response.user.role);
          this.redirectBasedOnRole(response.user);
        } else {
          console.log('⚠️ No user in response, redirecting to home');
          this.router.navigate(['/home']);
        }
        
      } catch (error: any) {
        const blockedStatus = error?.error?.status;
        const blockedMessage = error?.error?.message || '';

        if (blockedStatus === 'pending_approval' || blockedStatus === 'rejected' || blockedMessage.toLowerCase().includes('not verified')) {
          this.ownerVerificationMessage = blockedMessage || 'Your account is waiting for admin verification. Login is disabled until approval.';
          this.ownerVerificationStatus = blockedStatus === 'rejected' ? 'rejected' : 'pending_approval';
          // Try to detect role from message (supplier/owner)
          if (blockedMessage.toLowerCase().includes('supplier')) {
            this.verificationRole = 'supplier';
          } else if (blockedMessage.toLowerCase().includes('owner') || blockedMessage.toLowerCase().includes('karenderia')) {
            this.verificationRole = 'owner';
          } else {
            this.verificationRole = '';
          }
        }

        if (error?.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error?.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }
        console.error('Login error:', error);
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

  goToReapply() {
    const email = this.loginData.emailOrUsername;
    const role = this.verificationRole || 'owner';
    this.router.navigate(['/owner-reapply'], { queryParams: { email, role } });
  }
}
