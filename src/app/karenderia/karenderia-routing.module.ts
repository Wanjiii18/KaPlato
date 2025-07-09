import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/karenderia-dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('../karenderia-dashboard/karenderia-dashboard.module').then(m => m.KarenderiaDashboardPageModule)
  },
  {
    path: 'menu',
    loadChildren: () => import('../karenderia-menu/karenderia-menu.module').then(m => m.KarenderiaMenuPageModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('../karenderia-inventory/karenderia-inventory.module').then(m => m.KarenderiaInventoryPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaRoutingModule {}