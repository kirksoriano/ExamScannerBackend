import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TesterPage } from './tester.page';

const routes: Routes = [
  {
    path: '',
    component: TesterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TesterPageRoutingModule {}
