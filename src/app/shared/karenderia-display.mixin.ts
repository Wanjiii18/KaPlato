import { Injectable } from '@angular/core';
import { KarenderiaInfoService } from '../services/karenderia-info.service';

/**
 * Mixin class to provide karenderia display functionality to components
 * Usage: Apply this mixin to any component that needs dynamic karenderia display
 */
@Injectable()
export class KarenderiaDisplayMixin {
  
  constructor(protected karenderiaInfoService: KarenderiaInfoService) {}

  /**
   * Get the display name for the current karenderia
   */
  getKarenderiaDisplayName(): string {
    return this.karenderiaInfoService.getKarenderiaDisplayName();
  }

  /**
   * Get the brand initials for the current karenderia
   */
  getKarenderiaBrandInitials(): string {
    return this.karenderiaInfoService.getKarenderiaBrandInitials();
  }

  /**
   * Get the current karenderia object
   */
  getCurrentKarenderia() {
    return this.karenderiaInfoService.getCurrentKarenderia();
  }
}
