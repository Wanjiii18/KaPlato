import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { KarenderiaService } from '../../services/karenderia.service';
import { CommonModule, DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonChip, 
  IonLabel, 
  IonSpinner, 
  IonBadge,
  IonText 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  refresh, 
  restaurant, 
  location, 
  call, 
  mail, 
  map, 
  time, 
  card, 
  cash, 
  create, 
  hourglassOutline, 
  checkmarkCircle, 
  closeCircle, 
  helpCircle,
  restaurantOutline
} from 'ionicons/icons';

declare var google: any;

// Add icons
addIcons({ 
  'refresh': refresh,
  'restaurant': restaurant,
  'location': location,
  'call': call,
  'mail': mail,
  'map': map,
  'time': time,
  'card': card,
  'cash': cash,
  'create': create,
  'hourglass-outline': hourglassOutline,
  'checkmark-circle': checkmarkCircle,
  'close-circle': closeCircle,
  'help-circle': helpCircle,
  'restaurant-outline': restaurantOutline
});

interface Karenderia {
  id: number;
  name: string;
  description: string;
  address: string;
  phone?: string;
  email?: string;
  latitude: number;
  longitude: number;
  opening_time?: string;
  closing_time?: string;
  operating_days?: string[];
  delivery_fee?: number;
  delivery_time_minutes?: number;
  accepts_cash: boolean;
  accepts_online_payment: boolean;
  status: 'pending' | 'active' | 'inactive';
  status_message: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-karenderia-dashboard',
  templateUrl: './karenderia-dashboard.page.html',
  styleUrls: ['./karenderia-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    DatePipe,
    TitleCasePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonSpinner,
    IonBadge,
    IonText
  ]
})
export class KarenderiaDashboardPage implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  karenderia: Karenderia | null = null;
  isLoading = true;
  map: any;

  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router,
    private karenderiaService: KarenderiaService
  ) { }

  ngOnInit() {
    this.loadKarenderiaStatus();
  }

  ngAfterViewInit() {
    // Map will be loaded after karenderia data is available
  }

  async loadKarenderiaStatus() {
    this.isLoading = true;
    
    try {
      const response = await this.karenderiaService.getMyKarenderia().toPromise();
      
      if (response.success) {
        this.karenderia = response.data;
        
        // Load map after data is available
        setTimeout(() => {
          if (this.karenderia && this.mapContainer) {
            this.loadMap();
          }
        }, 100);
      } else {
        this.karenderia = null;
      }
    } catch (error: any) {
      console.error('Error loading karenderia status:', error);
      
      // If 404, means no karenderia application found
      if (error.status === 404) {
        this.karenderia = null;
      } else {
        this.showToast(error.message || 'Failed to load karenderia information', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  loadMap() {
    if (!this.karenderia || !this.mapContainer) return;

    try {
      const location = {
        lat: this.karenderia.latitude,
        lng: this.karenderia.longitude
      };

      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: location,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      // Add marker for karenderia location
      new google.maps.Marker({
        position: location,
        map: this.map,
        title: this.karenderia.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23e74c3c" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

    } catch (error) {
      console.error('Error loading map:', error);
    }
  }

  async refreshStatus() {
    const loading = await this.loadingController.create({
      message: 'Refreshing status...',
      duration: 2000
    });
    await loading.present();
    
    await this.loadKarenderiaStatus();
    await loading.dismiss();
    
    this.showToast('Status refreshed', 'success');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'hourglass-outline';
      case 'active': return 'checkmark-circle';
      case 'inactive': return 'close-circle';
      default: return 'help-circle';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Under Review';
      case 'active': return 'Approved & Active';
      case 'inactive': return 'Rejected/Inactive';
      default: return 'Unknown Status';
    }
  }

  editKarenderia() {
    if (this.karenderia) {
      this.router.navigate(['/karenderia-registration'], {
        queryParams: { edit: true, id: this.karenderia.id }
      });
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
