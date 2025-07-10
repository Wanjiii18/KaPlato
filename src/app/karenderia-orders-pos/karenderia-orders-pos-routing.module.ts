import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaOrdersPosPage } from './karenderia-orders-pos.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaOrdersPosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaOrdersPosPageRoutingModule {}
