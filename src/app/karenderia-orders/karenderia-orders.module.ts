import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KarenderiaOrdersPageRoutingModule } from './karenderia-orders-routing.module';

import { KarenderiaOrdersPage } from './karenderia-orders.page';
import { OwnerShellComponent } from '../components/owner-shell/owner-shell.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OwnerShellComponent,
    KarenderiaOrdersPageRoutingModule
  ],
  declarations: [KarenderiaOrdersPage]
})
export class KarenderiaOrdersPageModule {}
