import { Injectable } from '@angular/core';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private readonly API_KEY = 'AIzaSyDZ2rFJFWj-BMMI3_g8WPJbywlXrqY_yrA'; // Move to environment

  constructor() { }

  loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Maps:', error);
        this.loadPromise = null; // Reset so we can try again
        reject(error);
      };
      
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && typeof google !== 'undefined' && google.maps;
  }

  async waitForGoogleMaps(): Promise<void> {
    if (this.isGoogleMapsLoaded()) {
      return Promise.resolve();
    }

    return this.loadGoogleMaps();
  }
}
