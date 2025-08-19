import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false
})
export class TabsPage implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Temporarily disabled authentication check for UI testing
    // this.authService.currentUser$.subscribe(user => {
    //   if (!user) {
    //     this.router.navigate(['/login']);
    //   }
    // });
    
    // Listen to route changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Navigation tracking without console logs
      }
    });
    
    // Force navigation to home if we're at the base tabs route
    setTimeout(() => {
      if (this.router.url === '/tabs' || this.router.url === '/tabs/' || this.router.url === '/') {
        this.router.navigate(['/home']);
      }
    }, 100);
  }
}
