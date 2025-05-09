import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { QuestionGeneratorPageRoutingModule } from './question-generator-routing.module';

import { QuestionGeneratorPage } from './question-generator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuestionGeneratorPageRoutingModule,
    RouterModule.forChild([{ path: '', component: QuestionGeneratorPage }])
  ]
})
export class QuestionGeneratorPageModule {}
