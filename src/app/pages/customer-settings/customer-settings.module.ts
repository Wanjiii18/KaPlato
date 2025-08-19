import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CustomerSettingsPageRoutingModule } from './customer-settings-routing.module';
import { CustomerSettingsPageSimple } from './customer-settings-simple.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomerSettingsPageRoutingModule
  ],
  declarations: [CustomerSettingsPageSimple],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CustomerSettingsPageModule {}
