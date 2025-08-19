import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowsePageSimple } from './browse-simple.page';

const routes: Routes = [
  {
    path: '',
    component: BrowsePageSimple
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BrowsePageRoutingModule {}
