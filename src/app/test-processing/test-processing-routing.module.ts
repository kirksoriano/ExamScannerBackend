import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { testprocessingPage } from './test-processing.page';

const routes: Routes = [
  {
    path: '',
    component: testprocessingPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestProcessingPageRoutingModule {}
