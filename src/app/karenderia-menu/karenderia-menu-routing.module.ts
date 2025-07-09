import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaMenuPage } from './karenderia-menu.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaMenuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaMenuPageRoutingModule {}
