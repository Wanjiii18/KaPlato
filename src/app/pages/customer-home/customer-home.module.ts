import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CustomerHomePageRoutingModule } from './customer-home-routing.module';
import { CustomerHomePage } from './customer-home-simple.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomerHomePageRoutingModule
  ],
  declarations: [CustomerHomePage],
  exports: [CustomerHomePage],  // Export the component
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CustomerHomePageModule {}
