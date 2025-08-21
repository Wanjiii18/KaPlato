import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapComponent } from './map/map.component';
import { MealAllergenCardComponent } from './meal-allergen-card/meal-allergen-card.component';

@NgModule({
  declarations: [MapComponent],
  imports: [
    CommonModule,
    IonicModule,
    MealAllergenCardComponent
  ],
  exports: [MapComponent, MealAllergenCardComponent]
})
export class ComponentsModule { }