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

    console.log('KarenderiaGuard: User role is', currentUser.role, 'not karenderia_owner, redirecting to home');
    this.router.navigate(['/home']);
    return of(false);
  }
}
