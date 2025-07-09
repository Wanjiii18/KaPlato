import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaInventoryPage } from './karenderia-inventory.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaInventoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaInventoryPageRoutingModule {}
