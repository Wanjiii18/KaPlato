import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KarenderiaAnalyticsPage } from './karenderia-analytics.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaAnalyticsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaAnalyticsPageRoutingModule {}
