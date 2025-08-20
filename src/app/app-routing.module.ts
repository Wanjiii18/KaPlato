import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { KarenderiaGuard } from './guards/karenderia.guard';
import { CustomerGuard } from './guards/customer.guard';
import { AdminGuard } from './guards/admin.guard';
import { CustomPreloadingStrategy } from './services/custom-preloading.service';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'role-redirect',
    loadComponent: () => import('./components/role-redirect.component').then(m => m.RoleRedirectComponent)
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
    path: 'karenderia-registration',
    loadChildren: () => import('./pages/karenderia-registration/karenderia-registration.module').then( m => m.KarenderiaRegistrationPageModule),
    canActivate: [AuthGuard]
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
  {
    path: 'meal-planner',
    loadChildren: () => import('./meal-planner/meal-planner.module').then(m => m.MealPlannerPageModule),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'map-view',
    loadChildren: () => import('./map-view/map-view.module').then(m => m.MapViewPageModule)
    // No guards - allow public access for better user experience
  },
  {
    path: 'karenderia-detail/:id',
    loadChildren: () => import('./karenderia-detail/karenderia-detail.page.module').then(m => m.KarenderiaDetailPageModule)
  },
  {
    path: 'karenderias-browse',
    loadChildren: () => import('./karenderias-browse/karenderias-browse.module').then(m => m.KarenderiasBrowsePageModule),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'admin-dashboard',
    loadChildren: () => import('./pages/admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin-location-management',
    loadChildren: () => import('./pages/admin-location-management/admin-location-management.module').then(m => m.AdminLocationManagementPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'meal-details/:id',
    loadComponent: () => import('./meal-details/meal-details.page').then(m => m.MealDetailsPage)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./favorites/favorites.page').then(m => m.FavoritesPage),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'meal-history',
    loadComponent: () => import('./meal-history/meal-history.page').then(m => m.MealHistoryPage),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'allergen-profile',
    loadComponent: () => import('./pages/allergen-profile/allergen-profile.page').then(m => m.AllergenProfilePage),
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'nutrition-demo',
    loadComponent: () => import('./nutrition-demo/nutrition-demo.page').then(m => m.NutritionDemoPage)
    // No auth guard for demo purposes - accessible to all users
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { 
      preloadingStrategy: CustomPreloadingStrategy,
      enableTracing: false // Set to true only for debugging
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
