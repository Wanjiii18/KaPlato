import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaOrdersPage } from './karenderia-orders.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaOrdersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaOrdersPageRoutingModule {}
