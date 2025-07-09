import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaIngredientsPageRoutingModule } from './karenderia-ingredients-routing.module';

import { KarenderiaIngredientsPage } from './karenderia-ingredients.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KarenderiaIngredientsPageRoutingModule
  ],
  declarations: [KarenderiaIngredientsPage]
})
export class KarenderiaIngredientsPageModule {}
