import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CropperPage } from './cropper.page';

const routes: Routes = [
  {
    path: '',
    component: CropperPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CropperPageRoutingModule {}
