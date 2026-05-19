import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SupplyOrderMessage {
  id?: string;
  orderId: number;
  supplierId: number;
  karenderiaId: number;
  senderId: string;
  senderRole: 'supplier' | 'karenderia_owner';
  senderName?: string;
  content: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface SupplyOrderConversation {
  orderId: number;
  supplierId: number;
  karenderiaId: number;
  messages: SupplyOrderMessage[];
}

@Injectable({
  providedIn: 'root'
})
export class SupplyOrderMessagingService {
  private conversationsSubject = new BehaviorSubject<Map<number, SupplyOrderConversation>>(new Map());
  public conversations$ = this.conversationsSubject.asObservable();

  private messagesKey = 'supply_order_messages';

  constructor() {
    this.loadMessagesFromStorage();
  }

  private loadMessagesFromStorage() {
    try {
      const stored = localStorage.getItem(this.messagesKey);
      if (stored) {
        const conversations = JSON.parse(stored);
        const conversationMap = new Map<number, SupplyOrderConversation>();
        
        // Convert stored data back to Map
        Object.entries(conversations).forEach(([orderId, conversation]: any) => {
          const messages = conversation.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          conversationMap.set(parseInt(orderId), {
            ...conversation,
            messages
          });
        });
        
        this.conversationsSubject.next(conversationMap);
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
  }

  private saveMessagesToStorage() {
    try {
      const conversations = this.conversationsSubject.value;
      const conversationObj: any = {};
      
      conversations.forEach((conversation, orderId) => {
        conversationObj[orderId] = conversation;
      });
      
      localStorage.setItem(this.messagesKey, JSON.stringify(conversationObj));
    } catch (error) {
      console.error('Error saving messages to storage:', error);
    }
  }

  addMessage(message: SupplyOrderMessage): void {
    const conversations = this.conversationsSubject.value;
    const orderId = message.orderId;
    
    if (!conversations.has(orderId)) {
      conversations.set(orderId, {
        orderId: message.orderId,
        supplierId: message.supplierId,
        karenderiaId: message.karenderiaId,
        messages: []
      });
    }

    message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    conversations.get(orderId)!.messages.push(message);
    
    this.conversationsSubject.next(conversations);
    this.saveMessagesToStorage();
  }

  getConversation(orderId: number): Observable<SupplyOrderConversation | undefined> {
    return new Observable(observer => {
      this.conversations$.subscribe(conversations => {
        observer.next(conversations.get(orderId));
      });
    });
  }

  getConversationSync(orderId: number): SupplyOrderConversation | undefined {
    return this.conversationsSubject.value.get(orderId);
  }

  getAllConversations(): Observable<SupplyOrderConversation[]> {
    return new Observable(observer => {
      this.conversations$.subscribe(conversationMap => {
        const conversations = Array.from(conversationMap.values());
        observer.next(conversations);
      });
    });
  }

  deleteConversation(orderId: number): void {
    const conversations = this.conversationsSubject.value;
    conversations.delete(orderId);
    this.conversationsSubject.next(conversations);
    this.saveMessagesToStorage();
  }

  clearAllConversations(): void {
    this.conversationsSubject.next(new Map());
    localStorage.removeItem(this.messagesKey);
  }
}
