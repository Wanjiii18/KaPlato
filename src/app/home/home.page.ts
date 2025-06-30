import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService, UserProfile } from '../services/user.service';
import { KarenderiaService } from '../services/karenderia.service';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;
  private userSubscription: Subscription | undefined;
  private profileSubscription: Subscription | undefined;
  isLoading = true;
  showMap = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private karenderiaService: KarenderiaService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoading = false;
    });

    // Subscribe to user profile changes
    this.profileSubscription = this.userService.currentUserProfile$.subscribe(profile => {
      this.userProfile = profile;
    });

    // Initialize sample karenderia data
    this.initializeKarenderiaData();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  toggleMap() {
    this.showMap = !this.showMap;
  }

  private async initializeKarenderiaData() {
    try {
      await this.karenderiaService.seedInitialData();
    } catch (error) {
      console.warn('Could not initialize karenderia data:', error);
    }
  }

  searchKarenderia() {
    // Placeholder for search functionality
    console.log('Search functionality coming soon...');
  }

  async logout() {
    await this.authService.logout();
  }

  goToApplicationPage() {
    this.router.navigate(['/karenderia-application']);
  }
}
