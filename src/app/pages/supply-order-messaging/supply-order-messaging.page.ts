import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { SupplyOrderMessagingService, SupplyOrderMessage } from '../../services/supply-order-messaging.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-supply-order-messaging',
  templateUrl: './supply-order-messaging.page.html',
  styleUrls: ['./supply-order-messaging.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SupplyOrderMessagingPage implements OnInit, AfterViewChecked {
  @Input() orderId: number = 0;
  @Input() supplierId: number = 0;
  @Input() karenderiaId: number = 0;
  @Input() otherPartyName: string = 'Other Party';
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages: SupplyOrderMessage[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  currentUserRole: 'supplier' | 'karenderia_owner' = 'karenderia_owner';
  private shouldScroll = false;

  constructor(
    private messagingService: SupplyOrderMessagingService,
    private modalController: ModalController,
    private alertController: AlertController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadConversation();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadCurrentUser() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.currentUserRole = user.role === 'supplier' ? 'supplier' : 'karenderia_owner';
    }
  }

  private loadConversation() {
    const conversation = this.messagingService.getConversationSync(this.orderId);
    if (conversation) {
      this.messages = conversation.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
  }

  sendMessage() {
    if (!this.newMessage || !this.newMessage.trim()) {
      return;
    }

    const message: SupplyOrderMessage = {
      orderId: this.orderId,
      supplierId: this.supplierId,
      karenderiaId: this.karenderiaId,
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      content: this.newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    this.messagingService.addMessage(message);
    this.messages.push(message);
    this.newMessage = '';
    this.shouldScroll = true;
  }

  isSentByCurrentUser(message: SupplyOrderMessage): boolean {
    return message.senderRole === this.currentUserRole;
  }

  private scrollToBottom() {
    try {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  async clearConversation() {
    const alert = await this.alertController.create({
      header: 'Clear Conversation',
      message: 'Are you sure you want to delete all messages in this conversation? This cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.messagingService.deleteConversation(this.orderId);
            this.messages = [];
          }
        }
      ]
    });

    await alert.present();
  }

  dismissModal() {
    this.modalController.dismiss();
  }
}
