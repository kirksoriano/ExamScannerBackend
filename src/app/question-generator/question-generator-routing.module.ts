import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuestionGeneratorPage } from './question-generator.page';

const routes: Routes = [
  {
    path: '',
    component: QuestionGeneratorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuestionGeneratorPageRoutingModule {}
