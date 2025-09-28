import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, tap, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // First check immediate auth status from sessionStorage
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      console.log('Auth Guard: User authenticated (direct check), allowing access');
      return of(true);
    }

    // If no immediate user, check the observable stream
    return this.authService.currentUser$.pipe(
      // Wait for auth to be fully initialized (skip undefined values)
      map(user => user !== undefined ? !!user : null),
      // Only proceed when we have a definitive answer (not null)
      filter(authenticated => authenticated !== null),
      take(1),
      tap(loggedIn => {
        if (!loggedIn) {
          this.router.navigate(['/login']);
        }
      })
    ) as Observable<boolean>;
  }
}
