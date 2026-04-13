import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { KarenderiaInfoService } from '../../services/karenderia-info.service';

export type OwnerNavKey =
  | 'dashboard'
  | 'menu'
  | 'daily-menu'
  | 'pos'
  | 'inventory'
  | 'analytics'
  | 'profile';

@Component({
  selector: 'app-owner-shell',
  templateUrl: './owner-shell.component.html',
  styleUrls: ['./owner-shell.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
})
export class OwnerShellComponent {
  @Input() activePage: OwnerNavKey = 'dashboard';
  @Input() sectionLabel = 'Owner Panel';

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController,
    private karenderiaInfoService: KarenderiaInfoService
  ) {}

  isActive(page: OwnerNavKey): boolean {
    return this.activePage === page;
  }

  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }

  async logout(): Promise<void> {
    try {
      this.authService.logout();
    } catch (error) {
      console.warn('Logout API call failed, clearing local session anyway.', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      await this.router.navigate(['/login']);
      const toast = await this.toastController.create({
        message: 'Logged out successfully.',
        duration: 1800,
        color: 'medium',
      });
      await toast.present();
    }
  }
}
