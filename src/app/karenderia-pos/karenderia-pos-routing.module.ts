import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaPosPage } from './karenderia-pos.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaPosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaPosPageRoutingModule {}
