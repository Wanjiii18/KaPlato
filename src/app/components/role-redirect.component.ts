import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-role-redirect',
  template: `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="color: white; font-size: 1.1rem;">Redirecting...</div>
    </div>
  `,
  standalone: true,
  imports: []
})
export class RoleRedirectComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Use a very fast, direct approach
    this.handleRedirect();
  }

  private handleRedirect() {
    // Only redirect if we're actually on the role-redirect route
    if (this.router.url !== '/role-redirect') {
      console.log('RoleRedirect: Not on role-redirect route, skipping redirect');
      return;
    }
    
    // Temporarily redirect directly to home for UI testing
    console.log('RoleRedirect: Redirecting to home for UI testing');
    this.router.navigate(['/home'], { replaceUrl: true });
    return;
    
    // Original authentication logic (commented out for testing)
    /*
    // Check authentication immediately using synchronous methods
    const token = this.authService.getAuthToken();
    const currentUser = this.authService.getCurrentUser();

    console.log('RoleRedirect: Token exists:', !!token);
    console.log('RoleRedirect: Current user:', currentUser);

    if (!token) {
      // No token, redirect to login immediately
      console.log('RoleRedirect: No token, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser) {
      // User data is available, redirect based on role
      console.log('RoleRedirect: User data available, redirecting based on role:', currentUser.role);
      this.redirectBasedOnRole(currentUser);
      return;
    }

    // Token exists but user data not loaded yet, give it a very short time
    console.log('RoleRedirect: Token exists but user not loaded, waiting briefly...');
    setTimeout(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        console.log('RoleRedirect: User loaded after brief wait:', user.role);
        this.redirectBasedOnRole(user);
      } else {
        console.log('RoleRedirect: User still not loaded, redirecting to login');
        this.router.navigate(['/login']);
      }
    }, 100); // Very short 100ms wait
    */
    setTimeout(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        console.log('RoleRedirect: User loaded after brief wait:', user.role);
        this.redirectBasedOnRole(user);
      } else {
        console.log('RoleRedirect: User still not loaded, redirecting to login');
        this.router.navigate(['/login']);
      }
    }, 100); // Very short 100ms wait
  }

  private redirectBasedOnRole(user: any) {
    console.log('RoleRedirect: Redirecting user with role:', user?.role);
    
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
}
