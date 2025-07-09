import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaOrdersPageRoutingModule } from './karenderia-orders-routing.module';

import { KarenderiaOrdersPage } from './karenderia-orders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaOrdersPageRoutingModule
  ],
  declarations: [KarenderiaOrdersPage]
})
export class KarenderiaOrdersPageModule {}
