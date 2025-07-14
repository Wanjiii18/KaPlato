import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserService, UserProfile } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class KarenderiaGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.userService.currentUserProfile$.pipe(
      take(1),
      map((user: UserProfile | null) => {
        if (user && user.role === 'karenderia_owner') {
          return true;
        } else {
          this.router.navigate(['/home']);
          return false;
        }
      })
    );
  }
}
