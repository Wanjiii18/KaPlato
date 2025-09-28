import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminLocationManagementPage } from './admin-location-management.page';

const routes: Routes = [
  {
    path: '',
    component: AdminLocationManagementPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminLocationManagementPageRoutingModule {}
