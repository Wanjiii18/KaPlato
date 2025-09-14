import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaApplicationPageRoutingModule } from './karenderia-application-routing.module';
import { KarenderiaApplicationPage } from './karenderia-application.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaApplicationPageRoutingModule,
    SharedModule
  ],
  declarations: [KarenderiaApplicationPage]
})
export class KarenderiaApplicationPageModule {}
