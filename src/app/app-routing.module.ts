import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { KarenderiaGuard } from './guards/karenderia.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'karenderia-application',
    loadChildren: () => import('./karenderia-application/karenderia-application.module').then( m => m.KarenderiaApplicationPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'karenderia-dashboard',
    loadChildren: () => import('./karenderia-dashboard/karenderia-dashboard.module').then( m => m.KarenderiaDashboardPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
  {
    path: 'karenderia-menu',
    loadChildren: () => import('./karenderia-menu/karenderia-menu.module').then( m => m.KarenderiaMenuPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
  {
    path: 'karenderia-ingredients',
    loadChildren: () => import('./karenderia-ingredients/karenderia-ingredients.module').then( m => m.KarenderiaIngredientsPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
  {
    path: 'karenderia-orders',
    loadChildren: () => import('./karenderia-orders/karenderia-orders.module').then( m => m.KarenderiaOrdersPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
  {
    path: 'karenderia-analytics',
    loadChildren: () => import('./karenderia-analytics/karenderia-analytics.module').then( m => m.KarenderiaAnalyticsPageModule)
  },
  {
    path: 'karenderia-orders-pos',
    loadChildren: () => import('./karenderia-orders-pos/karenderia-orders-pos.module').then( m => m.KarenderiaOrdersPosPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
  {
    path: 'order-details',
    loadChildren: () => import('./pages/order-details/order-details.module').then( m => m.OrderDetailsPageModule),
    canActivate: [AuthGuard, KarenderiaGuard]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
