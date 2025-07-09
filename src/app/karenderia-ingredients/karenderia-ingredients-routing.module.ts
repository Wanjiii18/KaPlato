import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaIngredientsPage } from './karenderia-ingredients.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaIngredientsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaIngredientsPageRoutingModule {}
