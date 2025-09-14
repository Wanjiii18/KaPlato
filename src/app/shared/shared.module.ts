import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { OrderModalComponent } from '../modals/order-modal/order-modal.component';
import { LocationMapComponent } from './components/location-map/location-map.component';

@NgModule({
  declarations: [
    OrderModalComponent,
    LocationMapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [
    OrderModalComponent,
    LocationMapComponent
  ]
})
export class SharedModule { }
