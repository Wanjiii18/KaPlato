import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaInventoryPageRoutingModule } from './karenderia-inventory-routing.module';

import { KarenderiaInventoryPage } from './karenderia-inventory.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaInventoryPageRoutingModule
  ],
  declarations: [KarenderiaInventoryPage]
})
export class KarenderiaInventoryPageModule {}
