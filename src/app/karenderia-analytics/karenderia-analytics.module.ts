import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaAnalyticsPageRoutingModule } from './karenderia-analytics-routing.module';
import { SharedModule } from '../shared/shared.module';

import { KarenderiaAnalyticsPage } from './karenderia-analytics.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaAnalyticsPageRoutingModule,
    SharedModule
  ],
  declarations: [KarenderiaAnalyticsPage]
})
export class KarenderiaAnalyticsPageModule {}
