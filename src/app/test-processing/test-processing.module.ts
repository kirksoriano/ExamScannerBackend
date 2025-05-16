import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { TestProcessingPageRoutingModule } from './test-processing-routing.module';

import { testprocessingPage } from './test-processing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestProcessingPageRoutingModule,
    RouterModule.forChild([{ path: '', component: testprocessingPage }])
  ]
})
export class TestProcessingPageModule {}
