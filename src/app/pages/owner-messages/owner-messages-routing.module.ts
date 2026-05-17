import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerMessagesPage } from './owner-messages.page';

const routes: Routes = [
  {
    path: '',
    component: OwnerMessagesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnerMessagesRoutingModule { }
