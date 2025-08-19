import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { KarenderiasBrowsePageRoutingModule } from './karenderias-browse-routing.module';
import { KarenderiasBrowsePage } from './karenderias-browse.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiasBrowsePageRoutingModule
  ],
  declarations: [KarenderiasBrowsePage]
})
export class KarenderiasBrowsePageModule {}