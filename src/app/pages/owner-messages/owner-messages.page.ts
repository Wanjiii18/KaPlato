import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent, AlertController, ToastController, ModalController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { OwnerShellComponent } from '../../components/owner-shell/owner-shell.component';
import { MessageService, Message, Conversation } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  chatbubbleOutline, 
  sendOutline, 
  callOutline, 
  phonePortraitOutline,
  searchOutline,
  refreshOutline,
  arrowBackOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-owner-messages',
  templateUrl: './owner-messages.page.html',
  styleUrls: ['./owner-messages.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, OwnerShellComponent]
})
export class OwnerMessagesPage implements OnInit {
  @ViewChild('messageContent') messageContent!: IonContent;

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  conversationMessages: Message[] = [];
  
  isLoadingConversations = true;
  isLoadingMessages = false;
  isSendingMessage = false;
  
  newMessage = '';
  searchTerm = '';
  unreadCount = 0;
  currentUserId = 0;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'chatbubble-outline': chatbubbleOutline,
      'send-outline': sendOutline,
      'call-outline': callOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'search-outline': searchOutline,
      'refresh-outline': refreshOutline,
      'arrow-back-outline': arrowBackOutline,
      'checkmark-done-outline': checkmarkDoneOutline
    });
  }

  ngOnInit() {
    const userId = this.authService.getCurrentUser()?.id;
    this.currentUserId = userId ? Number(userId) : 0;
    this.loadConversations();
    this.loadUnreadCount();
  }

  loadConversations() {
    this.isLoadingConversations = true;
    this.messageService.getConversations(1).subscribe({
      next: (response: any) => {
        this.conversations = response?.data || [];
        this.isLoadingConversations = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.isLoadingConversations = false;
        this.showToast('Failed to load conversations');
      }
    });
  }

  loadUnreadCount() {
    this.messageService.getUnreadCount().subscribe({
      next: (data) => {
        this.unreadCount = data?.unread_count || 0;
      },
      error: (error) => console.error('Error loading unread count:', error)
    });
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.loadConversationMessages(conversation);
  }

  loadConversationMessages(conversation: Conversation) {
    if (!conversation.ingredientRequest?.id) {
      this.showToast('Cannot load conversation - missing request ID');
      return;
    }

    this.isLoadingMessages = true;
    const otherUserId = conversation.from_user_id === this.currentUserId 
      ? conversation.to_user_id 
      : conversation.from_user_id;

    this.messageService.getConversation(conversation.ingredientRequest.id, otherUserId).subscribe({
      next: (response: any) => {
        this.conversationMessages = response?.data?.data || response?.data || [];
        this.isLoadingMessages = false;
        
        // Scroll to bottom after loading
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Refresh unread count
        this.loadUnreadCount();
      },
      error: (error) => {
        console.error('Error loading conversation messages:', error);
        this.isLoadingMessages = false;
        this.showToast('Failed to load messages');
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) {
      return;
    }

    if (!this.selectedConversation.ingredientRequest?.id) {
      this.showToast('Error: Invalid request ID');
      return;
    }

    const otherUserId = this.selectedConversation.from_user_id === this.currentUserId 
      ? this.selectedConversation.to_user_id 
      : this.selectedConversation.from_user_id;

    this.isSendingMessage = true;

    this.messageService.sendMessage({
      to_user_id: otherUserId,
      ingredient_request_id: this.selectedConversation.ingredientRequest.id,
      message: this.newMessage,
      type: 'text'
    }).subscribe({
      next: (response) => {
        this.conversationMessages.push(response?.data);
        this.newMessage = '';
        this.isSendingMessage = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isSendingMessage = false;
        this.showToast('Failed to send message');
      }
    });
  }

  async requestCall() {
    if (!this.selectedConversation) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Request a Call',
      message: 'Enter your phone number for the call:',
      inputs: [
        {
          name: 'phone',
          type: 'tel',
          placeholder: '09XXXXXXXXX',
          value: ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Call Request',
          handler: (data) => {
            if (data.phone) {
              this.sendCallRequest(data.phone);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  sendCallRequest(phoneNumber: string) {
    if (!this.selectedConversation?.ingredientRequest?.id) {
      this.showToast('Error: Invalid request ID');
      return;
    }

    const otherUserId = this.selectedConversation.from_user_id === this.currentUserId 
      ? this.selectedConversation.to_user_id 
      : this.selectedConversation.from_user_id;

    this.messageService.sendMessage({
      to_user_id: otherUserId,
      ingredient_request_id: this.selectedConversation.ingredientRequest.id,
      message: `Call request from ${phoneNumber}`,
      type: 'call_request',
      call_phone_number: phoneNumber
    }).subscribe({
      next: (response) => {
        this.conversationMessages.push(response?.data);
        this.scrollToBottom();
        this.showToast('Call request sent!');
      },
      error: (error) => {
        console.error('Error sending call request:', error);
        this.showToast('Failed to send call request');
      }
    });
  }

  scrollToBottom() {
    if (this.messageContent) {
      setTimeout(() => {
        this.messageContent.scrollToBottom(200);
      }, 100);
    }
  }

  backToConversations() {
    this.selectedConversation = null;
    this.conversationMessages = [];
    this.newMessage = '';
  }

  refreshConversations() {
    this.loadConversations();
    this.loadUnreadCount();
  }

  getFilteredConversations(): Conversation[] {
    if (!this.searchTerm) {
      return this.conversations;
    }

    return this.conversations.filter(conv => 
      conv.fromUser?.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      conv.toUser?.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      conv.ingredientRequest?.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getOtherUserName(conversation: Conversation): string {
    if (conversation.from_user_id === this.currentUserId) {
      return conversation.toUser?.name || 'Unknown';
    }
    return conversation.fromUser?.name || 'Unknown';
  }

  getConversationPreview(conversation: Conversation): string {
    return conversation.message.substring(0, 50) + (conversation.message.length > 50 ? '...' : '');
  }

  isMessageFromCurrentUser(message: Message): boolean {
    return message.from_user_id === this.currentUserId;
  }

  formatTime(dateTime: string): string {
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return dateTime;
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
