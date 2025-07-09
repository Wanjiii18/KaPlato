import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaDashboardPageRoutingModule } from './karenderia-dashboard-routing.module';

import { KarenderiaDashboardPage } from './karenderia-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaDashboardPageRoutingModule
  ],
  declarations: [KarenderiaDashboardPage]
})
export class KarenderiaDashboardPageModule {}
