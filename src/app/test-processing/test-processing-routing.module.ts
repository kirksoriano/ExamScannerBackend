import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestProcessingPage } from './test-processing.page';

const routes: Routes = [
  {
    path: '',
    component: TestProcessingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestProcessingPageRoutingModule {}
