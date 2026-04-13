import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map, take, catchError, timeout, switchMap } from 'rxjs/operators';
import { UserService, UserProfile } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class KarenderiaGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // First check if we have basic auth
    const currentUser = this.authService.getCurrentUser();
    
    console.log('KarenderiaGuard: Checking access, currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('KarenderiaGuard: No current user, redirecting to login');
      this.router.navigate(['/login']);
      return of(false);
    }

    // If we already have role info from auth service, use it directly
    if (currentUser.role === 'karenderia_owner') {
      console.log('KarenderiaGuard: User is karenderia_owner, access granted');
      return of(true);
    }

    if (currentUser.role === 'admin') {
      console.log('KarenderiaGuard: Admin attempted owner route, redirecting to admin dashboard');
      this.router.navigate(['/admin-dashboard']);
      return of(false);
    }

    if (currentUser.role === 'supplier') {
      console.log('KarenderiaGuard: Supplier attempted owner route, redirecting to inventory');
      this.router.navigate(['/inventory-management']);
      return of(false);
    }

    console.log('KarenderiaGuard: Non-owner attempted owner route, redirecting to home');
    this.router.navigate(['/home']);
    return of(false);
  }
}
