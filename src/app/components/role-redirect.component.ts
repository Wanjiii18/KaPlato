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
    // Check authentication immediately using synchronous methods
    const token = this.authService.getAuthToken();
    const currentUser = this.authService.getCurrentUser();

    console.log('🔄 RoleRedirect: Token exists:', !!token);
    console.log('🔄 RoleRedirect: Current user:', currentUser?.email, 'Role:', currentUser?.role);

    if (!token) {
      // No token, redirect to login immediately
      console.log('🔄 RoleRedirect: No token, redirecting to login');
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    if (currentUser) {
      // User data is available, redirect based on role
      console.log('🔄 RoleRedirect: Redirecting based on role:', currentUser.role);
      this.redirectBasedOnRole(currentUser);
      return;
    }

    // Token exists but user data not loaded yet, give it a short time
    console.log('🔄 RoleRedirect: Token exists but user not loaded, waiting...');
    setTimeout(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        console.log('🔄 RoleRedirect: User loaded, redirecting with role:', user.role);
        this.redirectBasedOnRole(user);
      } else {
        console.log('🔄 RoleRedirect: User still not loaded, redirecting to login');
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    }, 100);
  }

  private redirectBasedOnRole(user: any) {
    console.log('🔄 RoleRedirect: Redirecting user with role:', user?.role);
    
    switch (user?.role) {
      case 'admin':
        console.log('➡️ Admin detected, going to admin dashboard');
        this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        break;
      case 'karenderia_owner':
        console.log('➡️ Karenderia owner detected, going to karenderia dashboard');
        this.router.navigate(['/karenderia-dashboard'], { replaceUrl: true });
        break;
      case 'supplier':
        console.log('➡️ Supplier detected, going to supplier home');
        this.router.navigate(['/supplier-home'], { replaceUrl: true });
        break;
      case 'customer':
      default:
        console.log('➡️ Customer detected, going to home');
        this.router.navigate(['/home'], { replaceUrl: true });
        break;
    }
  }
}
