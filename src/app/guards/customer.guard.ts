import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (user && user.role === 'customer') {
          return true;
        } else if (user && user.role === 'karenderia_owner') {
          // Redirect karenderia owners to their dashboard
          this.router.navigate(['/karenderia-dashboard']);
          return false;
        } else {
          // No user or invalid role, redirect to login
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
