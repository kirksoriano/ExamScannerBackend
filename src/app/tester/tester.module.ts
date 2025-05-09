import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { TesterPageRoutingModule } from './tester-routing.module';

import { TesterPage } from './tester.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TesterPageRoutingModule,
    RouterModule.forChild([{ path: '', component: TesterPage }])
  ]
})
export class TesterPageModule {}
