import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-customer-home',
  template: `
    <ion-header [translucent]="true" class="modern-header">
      <ion-toolbar class="gradient-toolbar">
        <ion-title>
          <div class="header-title">
            <ion-icon name="restaurant" color="light"></ion-icon>
            <span>KaPlato</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="modern-dashboard">
      <div class="dashboard-content animate-fade-in">
        
        <!-- Welcome Header -->
        <div class="welcome-header animate-slide-up">
          <div class="welcome-content">
            <h1>Hello, Food Lover! 👋</h1>
            <p>Discover amazing Filipino cuisine around you</p>
            <div class="location-indicator">
              <ion-icon name="location-outline"></ion-icon>
              <span>Current Location</span>
            </div>
          </div>
          <div class="header-decoration">
            <ion-icon name="restaurant-outline"></ion-icon>
          </div>
        </div>

        <!-- Enhanced Search Bar -->
        <div class="search-section">
          <ion-searchbar 
            placeholder="Search restaurants, dishes, cuisines..."
            class="modern-searchbar">
          </ion-searchbar>
        </div>

        <!-- Quick Access Grid -->
        <div class="quick-access-section">
          <div class="section-header">
            <h2>Quick Actions</h2>
            <p>What would you like to do today?</p>
          </div>
          
          <div class="quick-grid">
            <ion-card class="quick-card modern-card">
              <ion-card-content>
                <div class="card-content">
                  <div class="card-icon">
                    <ion-icon name="search" color="primary"></ion-icon>
                  </div>
                  <div class="card-info">
                    <h3>Browse Restaurants</h3>
                    <p>Find local karenderias near you</p>
                  </div>
                  <ion-icon name="chevron-forward" class="arrow-icon"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card class="quick-card modern-card">
              <ion-card-content>
                <div class="card-content">
                  <div class="card-icon">
                    <ion-icon name="heart" color="danger"></ion-icon>
                  </div>
                  <div class="card-info">
                    <h3>My Favorites</h3>
                    <p>Your saved restaurants & dishes</p>
                  </div>
                  <ion-icon name="chevron-forward" class="arrow-icon"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card class="quick-card modern-card">
              <ion-card-content>
                <div class="card-content">
                  <div class="card-icon">
                    <ion-icon name="time" color="warning"></ion-icon>
                  </div>
                  <div class="card-info">
                    <h3>Order History</h3>
                    <p>View your past orders</p>
                  </div>
                  <ion-icon name="chevron-forward" class="arrow-icon"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card class="quick-card modern-card">
              <ion-card-content>
                <div class="card-content">
                  <div class="card-icon">
                    <ion-icon name="nutrition" color="success"></ion-icon>
                  </div>
                  <div class="card-info">
                    <h3>Nutrition Info</h3>
                    <p>Track your meal nutrition</p>
                  </div>
                  <ion-icon name="chevron-forward" class="arrow-icon"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Featured Section -->
        <div class="featured-section">
          <div class="section-header">
            <h2>Featured Today</h2>
            <p>Popular restaurants in your area</p>
          </div>
          
          <div class="featured-scroll">
            <ion-card *ngFor="let restaurant of featuredRestaurants" class="featured-card">
              <div class="featured-image">
                <img [src]="restaurant.image" [alt]="restaurant.name" />
                <div class="rating-badge">
                  <ion-icon name="star" color="warning"></ion-icon>
                  <span>{{ restaurant.rating }}</span>
                </div>
              </div>
              <ion-card-content>
                <h4>{{ restaurant.name }}</h4>
                <p>{{ restaurant.cuisine }}</p>
                <div class="restaurant-meta">
                  <span class="distance">{{ restaurant.distance }}</span>
                  <span class="delivery-time">25-35 min</span>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./customer-home-simple.page.scss'],
  standalone: false
})
export class CustomerHomePage implements OnInit {

  featuredRestaurants = [
    {
      name: "Lola Rosa's Kitchen",
      cuisine: "Traditional Filipino",
      rating: 4.5,
      distance: "0.8 km",
      image: "assets/images/restaurant1.jpg"
    },
    {
      name: "Karinderya ni Kuya",
      cuisine: "Home-style Cooking",
      rating: 4.3,
      distance: "1.2 km",
      image: "assets/images/restaurant2.jpg"
    },
    {
      name: "Tita's Place",
      cuisine: "Regional Specialties",
      rating: 4.7,
      distance: "0.5 km",
      image: "assets/images/restaurant3.jpg"
    }
  ];

  constructor() {}

  ngOnInit() {
  }
}
