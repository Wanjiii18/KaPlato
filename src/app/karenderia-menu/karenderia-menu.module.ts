import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaMenuPageRoutingModule } from './karenderia-menu-routing.module';

import { KarenderiaMenuPage } from './karenderia-menu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaMenuPageRoutingModule
  ],
  declarations: [KarenderiaMenuPage]
})
export class KarenderiaMenuPageModule {}
