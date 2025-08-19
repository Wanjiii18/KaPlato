import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Don't preload routes that shouldn't be preloaded
    if (route.data && route.data['skipPreload']) {
      return of(null);
    }

    // Preload critical routes immediately
    const criticalRoutes = ['home', 'login', 'register'];
    if (route.path && criticalRoutes.includes(route.path)) {
      return load();
    }

    // Preload other routes with a delay to avoid blocking initial load
    return of(null).pipe(
      delay(2000), // 2 second delay
      () => load()
    );
  }
}
