import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { MessageService, Message } from '../../services/message.service';
import { addIcons } from 'ionicons';
import { 
  checkmarkOutline, 
  closeOutline, 
  sendOutline, 
  callOutline,
  checkmarkDoneOutline,
  arrowBackOutline,
  timeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

interface SupplierQuote {
  id: number;
  supplier_id: number;
  ingredient_request_id: number;
  price_per_unit: number;
  available_quantity: number;
  unit: string;
  total_price: number;
  delivery_date: string;
  delivery_method: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface IngredientRequest {
  id: number;
  title: string;
  description: string;
  ingredient_type: string;
  needed_quantity: number;
  unit: string;
  budget: number;
  needed_by_date: string;
  status: string;
  karenderia: {
    id: number;
    business_name: string;
    owner_id: number;
  };
  acceptedSupplier?: {
    id: number;
    name: string;
  };
  quotes?: SupplierQuote[];
}

@Component({
  selector: 'app-supplier-request-detail',
  templateUrl: './supplier-request-detail.page.html',
  styleUrls: ['./supplier-request-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class SupplierRequestDetailPage implements OnInit {
  @ViewChild('messageContent') messageContent!: IonContent;

  requestId!: number;
  currentUserId = 0;
  ingredientRequest: IngredientRequest | null = null;
  myQuote: SupplierQuote | undefined;
  conversationMessages: Message[] = [];
  
  isLoadingRequest = true;
  isLoadingMessages = false;
  isSendingMessage = false;
  
  newMessage = '';
  ownerName = '';
  ownerId = 0;

  // Computed properties
  isBothPartiesAccepted = false;
  hasMyQuote = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private authService: AuthService,
    private messageService: MessageService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'checkmark-outline': checkmarkOutline,
      'close-outline': closeOutline,
      'send-outline': sendOutline,
      'call-outline': callOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'arrow-back-outline': arrowBackOutline,
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  ngOnInit() {
    const userId = this.authService.getCurrentUser()?.id;
    this.currentUserId = userId ? Number(userId) : 0;

    this.route.params.subscribe(params => {
      this.requestId = params['id'];
      if (this.requestId) {
        this.loadRequestDetail();
      }
    });
  }

  loadRequestDetail() {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    this.http.get<any>(`${environment.apiUrl}/ingredient-requests/${this.requestId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ingredientRequest = response.data;
          
          // Extract owner info
          if (this.ingredientRequest?.karenderia) {
            this.ownerId = this.ingredientRequest.karenderia.owner_id;
            // Find owner name from karenderia owner - may need to load separately
            this.ownerName = this.ingredientRequest.karenderia.business_name;
          }

          // Check if I have a quote and get my quote status
          if (this.ingredientRequest?.quotes) {
            this.myQuote = this.ingredientRequest.quotes.find(
              (q: SupplierQuote) => q.supplier_id === this.currentUserId
            );
            this.hasMyQuote = !!this.myQuote;
          }

          // Check if both parties accepted
          this.checkAcceptanceStatus();

          this.isLoadingRequest = false;

          // Load messages if we have owner ID
          if (this.ownerId && this.requestId) {
            this.loadMessages();
          }
        },
        error: (error) => {
          console.error('Error loading request:', error);
          this.isLoadingRequest = false;
          this.showToast('Failed to load request details');
        }
      });
  }

  loadMessages() {
    if (!this.ownerId || !this.requestId) return;

    this.isLoadingMessages = true;
    this.messageService.getConversation(this.requestId, this.ownerId).subscribe({
      next: (response: any) => {
        this.conversationMessages = response?.data || [];
        this.isLoadingMessages = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages = false;
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.ownerId) return;

    this.isSendingMessage = true;
    const messageData = {
      to_user_id: this.ownerId,
      ingredient_request_id: this.requestId,
      message: this.newMessage.trim(),
      type: 'text' as const
    };

    this.messageService.sendMessage(messageData).subscribe({
      next: (response) => {
        this.conversationMessages.push(response.data);
        this.newMessage = '';
        this.isSendingMessage = false;
        this.scrollToBottom();
        this.showToast('Message sent');
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isSendingMessage = false;
        this.showToast('Failed to send message');
      }
    });
  }

  acceptQuoteResponse() {
    if (!this.myQuote?.id) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    this.http.patch<any>(
      `${environment.apiUrl}/supplier-quotes/${this.myQuote.id}/accept-response`,
      {},
      { headers }
    ).subscribe({
      next: () => {
        this.showToast('You have accepted the order!');
        this.checkAcceptanceStatus();
        this.loadRequestDetail();
      },
      error: (error) => {
        console.error('Error accepting:', error);
        this.showToast('Failed to accept order');
      }
    });
  }

  cancelQuote() {
    this.alertController.create({
      header: 'Cancel Quote',
      message: 'Are you sure you want to cancel this quote?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel Quote',
          role: 'destructive',
          handler: () => {
            this.doCancel();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private doCancel() {
    if (!this.myQuote?.id) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    this.http.patch<any>(
      `${environment.apiUrl}/supplier-quotes/${this.myQuote.id}/cancel`,
      {},
      { headers }
    ).subscribe({
      next: () => {
        this.showToast('Quote cancelled');
        this.location.back();
      },
      error: (error) => {
        console.error('Error cancelling:', error);
        this.showToast('Failed to cancel quote');
      }
    });
  }

  markAsDelivered() {
    if (!this.isBothPartiesAccepted) {
      this.showToast('Both parties must accept before marking as delivered');
      return;
    }

    this.alertController.create({
      header: 'Mark as Delivered',
      message: 'Confirm that this order has been delivered?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Mark Delivered',
          handler: () => {
            this.doMarkDelivered();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private doMarkDelivered() {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    this.http.patch<any>(
      `${environment.apiUrl}/ingredient-requests/${this.requestId}/mark-delivered`,
      {},
      { headers }
    ).subscribe({
      next: () => {
        this.showToast('Order marked as delivered!');
        this.loadRequestDetail();
      },
      error: (error) => {
        console.error('Error marking delivered:', error);
        this.showToast('Failed to mark as delivered');
      }
    });
  }

  private checkAcceptanceStatus() {
    if (!this.ingredientRequest || !this.myQuote) {
      this.isBothPartiesAccepted = false;
      return;
    }

    // Both parties accepted if:
    // - Request status is 'accepted'
    // - My quote status is 'accepted'
    // - My quote is the accepted one
    this.isBothPartiesAccepted = 
      this.ingredientRequest.status === 'accepted' &&
      this.myQuote.status === 'accepted' &&
      this.ingredientRequest.acceptedSupplier?.id === this.currentUserId;
  }

  isMessageFromCurrentUser(message: Message): boolean {
    return message.from_user_id === this.currentUserId;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.messageContent?.scrollToBottom(300);
    }, 100);
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.location.back();
  }
}
