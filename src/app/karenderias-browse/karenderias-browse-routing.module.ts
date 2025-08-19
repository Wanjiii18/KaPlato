import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiasBrowsePage } from './karenderias-browse.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiasBrowsePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiasBrowsePageRoutingModule {}