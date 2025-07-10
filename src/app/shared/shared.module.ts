import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { OrderModalComponent } from '../modals/order-modal/order-modal.component';

@NgModule({
  declarations: [
    OrderModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [
    OrderModalComponent
  ]
})
export class SharedModule { }
