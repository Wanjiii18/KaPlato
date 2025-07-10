import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OrderModalComponent } from '../modals/order-modal/order-modal.component';

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
}
