import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaOrdersPosPageRoutingModule } from './karenderia-orders-pos-routing.module';

import { KarenderiaOrdersPosPage } from './karenderia-orders-pos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaOrdersPosPageRoutingModule
  ],
  declarations: [KarenderiaOrdersPosPage]
})
export class KarenderiaOrdersPosPageModule {}
