import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CustomerProfilePageRoutingModule } from './customer-profile-routing.module';
import { CustomerProfilePageSimple } from './customer-profile-simple.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomerProfilePageRoutingModule
  ],
  declarations: [CustomerProfilePageSimple],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CustomerProfilePageModule {}
