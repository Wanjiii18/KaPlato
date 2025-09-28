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
    
    // Check authentication immediately using synchronous methods
    const token = this.authService.getAuthToken();
    const currentUser = this.authService.getCurrentUser();

    console.log('RoleRedirect: Token exists:', !!token);
    console.log('RoleRedirect: Current user:', currentUser);

    if (!token || !currentUser) {
      // No token or user data, redirect to login immediately
      console.log('RoleRedirect: No authentication, redirecting to login');
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    // User is authenticated, redirect based on role
    console.log('RoleRedirect: User authenticated, redirecting based on role:', currentUser.role);
    
    switch (currentUser.role) {
      case 'customer':
        this.router.navigate(['/home'], { replaceUrl: true });
        break;
      case 'karenderia_owner':
        this.router.navigate(['/karenderia-dashboard'], { replaceUrl: true });
        break;
      case 'admin':
        this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        break;
      default:
        console.log('RoleRedirect: Unknown role, redirecting to login');
        this.router.navigate(['/login'], { replaceUrl: true });
        break;
    }
  }
}
