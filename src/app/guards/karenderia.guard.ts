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
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // If we already have role info from auth service, use it directly
    if (currentUser.role === 'karenderia_owner') {
      return of(true);
    }

    // Otherwise, try to get user profile with timeout
    return this.userService.currentUserProfile$.pipe(
      timeout(3000), // 3 second timeout to prevent infinite hanging
      take(1),
      map((user: UserProfile | null) => {
        if (user && user.role === 'karenderia_owner') {
          return true;
        } else {
          this.router.navigate(['/home']);
          return false;
        }
      }),
      catchError(error => {
        console.warn('KarenderiaGuard: Profile loading failed or timed out, checking auth service role:', error);
        // Fallback to auth service role if profile loading fails
        if (currentUser?.role === 'karenderia_owner') {
          return of(true);
        } else {
          this.router.navigate(['/home']);
          return of(false);
        }
      })
    );
  }
}
