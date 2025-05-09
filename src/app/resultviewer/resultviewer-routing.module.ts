import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResultviewerPage } from './resultviewer.page';

const routes: Routes = [
  {
    path: '',
    component: ResultviewerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResultviewerPageRoutingModule {}
