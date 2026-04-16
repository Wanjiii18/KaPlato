import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KarenderiaRegistrationPage } from './karenderia-registration.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaRegistrationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KarenderiaRegistrationPageModule {}
