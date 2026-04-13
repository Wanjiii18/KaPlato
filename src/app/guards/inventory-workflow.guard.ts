import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryWorkflowGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return of(false);
    }

    if (user.role === 'supplier' || user.role === 'karenderia_owner') {
      return of(true);
    }

    if (user.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
      return of(false);
    }

    this.router.navigate(['/home']);
    return of(false);
  }
}
