import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { KarenderiaDetailPage } from './karenderia-detail.page';

const routes = [
  {
    path: '',
    component: KarenderiaDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [KarenderiaDetailPage]
})
export class KarenderiaDetailPageModule {}
