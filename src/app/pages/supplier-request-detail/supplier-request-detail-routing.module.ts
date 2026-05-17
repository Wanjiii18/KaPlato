import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierRequestDetailPage } from './supplier-request-detail.page';

const routes: Routes = [
  {
    path: '',
    component: SupplierRequestDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SupplierRequestDetailRoutingModule { }
