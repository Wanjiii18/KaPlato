import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaApplicationPage } from './karenderia-application.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaApplicationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaApplicationPageRoutingModule {}
