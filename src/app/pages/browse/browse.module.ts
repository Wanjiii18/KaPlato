import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BrowsePageRoutingModule } from './browse-routing.module';
import { BrowsePageSimple } from './browse-simple.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BrowsePageRoutingModule
  ],
  declarations: [BrowsePageSimple],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BrowsePageModule {}
