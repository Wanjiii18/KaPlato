import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OrderModalComponent } from '../modals/order-modal/order-modal.component';
import { DetailedOrder } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private modalController: ModalController) { }

  /**
   * Open the order modal
   */
  async openOrderModal() {
    const modal = await this.modalController.create({
      component: OrderModalComponent,
      cssClass: 'order-modal',
      backdropDismiss: true
    });

    await modal.present();

    const result = await modal.onDidDismiss();
    return result.data;
  }

  /**
   * Get detailed orders for the karenderia
   */
  async getDetailedOrders(): Promise<DetailedOrder[]> {
    // Mock data for now - replace with actual API call
    return [
      {
        id: '1',
        orderNumber: 'KP-2025-001234',
        karenderiaId: '1',
        customerName: 'Juan Dela Cruz',
        customerPhone: '+639123456789',
        orderType: 'dine-in',
        items: [
          {
            menuItemId: '1',
            menuItemName: 'Adobong Manok',
            quantity: 2,
            unitPrice: 120,
            subtotal: 240,
            ingredientCost: 140,
            profitMargin: 100,
            preparationTime: 25,
            specialInstructions: 'Extra sauce please'
          }
        ],
        subtotal: 240,
        tax: 0,
        discount: 0,
        totalAmount: 240,
        paymentMethod: 'cash',
        orderStatus: 'completed',
        placedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(Date.now() - 1800000), // 30 min ago
        seasonalData: {
          season: 'dry',
          month: 8,
          dayOfWeek: 1,
          timeOfDay: 'lunch',
          weatherCondition: 'sunny'
        }
      }
    ];
  }
}
