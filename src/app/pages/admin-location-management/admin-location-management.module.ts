import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminLocationManagementPageRoutingModule } from 'src/app/pages/admin-location-management/admin-location-management-routing.module';
import { AdminLocationManagementPage } from './admin-location-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminLocationManagementPageRoutingModule,
    AdminLocationManagementPage
  ]
})
export class AdminLocationManagementPageModule {}
