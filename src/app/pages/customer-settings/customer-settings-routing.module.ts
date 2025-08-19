import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerSettingsPageSimple } from './customer-settings-simple.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerSettingsPageSimple
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerSettingsPageRoutingModule {}
