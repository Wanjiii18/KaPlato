import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { KarenderiaSettingsPage } from './karenderia-settings.page';

const routes: Routes = [
  {
    path: '',
    component: KarenderiaSettingsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [KarenderiaSettingsPage]
})
export class KarenderiaSettingsPageModule {}
