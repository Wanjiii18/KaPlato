import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-browse',
  templateUrl: './browse-simple.page.html',
  styleUrls: ['./browse-simple.page.scss'],
  standalone: false
})
export class BrowsePageSimple implements OnInit {

  sampleRestaurants = [
    {
      name: 'Mama\'s Kitchen',
      cuisine: 'Filipino',
      rating: '4.8',
      distance: '0.5 km',
      description: 'Authentic Filipino home-style cooking with a modern twist.',
      image: 'https://via.placeholder.com/300x200?text=Mama\'s+Kitchen'
    },
    {
      name: 'Sakura Sushi',
      cuisine: 'Japanese',
      rating: '4.6',
      distance: '1.2 km',
      description: 'Fresh sushi and traditional Japanese dishes.',
      image: 'https://via.placeholder.com/300x200?text=Sakura+Sushi'
    },
    {
      name: 'Bistro Manila',
      cuisine: 'International',
      rating: '4.5',
      distance: '0.8 km',
      description: 'Fusion cuisine with local and international flavors.',
      image: 'https://via.placeholder.com/300x200?text=Bistro+Manila'
    }
  ];

  constructor() {}

  ngOnInit() {
  }
}
