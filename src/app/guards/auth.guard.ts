import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
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
    return this.authService.currentUser$.pipe(
      // Wait for auth to be fully initialized (skip undefined values)
      map(user => user !== undefined ? !!user : null),
      // Only proceed when we have a definitive answer (not null)
      filter(authenticated => authenticated !== null),
      take(1),
      tap(loggedIn => {
        if (!loggedIn) {
          console.log('Auth Guard: User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
        } else {
          console.log('Auth Guard: User authenticated, allowing access');
        }
      })
    ) as Observable<boolean>;
  }
}
