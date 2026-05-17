import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OwnerMessagesRoutingModule } from './owner-messages-routing.module';
import { OwnerMessagesPage } from './owner-messages.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OwnerMessagesRoutingModule,
    OwnerMessagesPage
  ]
})
export class OwnerMessagesModule { }
