import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaPosPageRoutingModule } from './karenderia-pos-routing.module';

import { KarenderiaPosPage } from './karenderia-pos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaPosPageRoutingModule
  ],
  declarations: [KarenderiaPosPage]
})
export class KarenderiaPosPageModule {}
