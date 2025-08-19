import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerProfilePageSimple } from './customer-profile-simple.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerProfilePageSimple
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerProfilePageRoutingModule {}
