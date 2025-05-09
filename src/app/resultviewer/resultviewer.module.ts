import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResultviewerPageRoutingModule } from './resultviewer-routing.module';
import { RouterModule } from '@angular/router';
import { ResultviewerPage } from './resultviewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResultviewerPageRoutingModule,
    RouterModule.forChild([{ path: '', component: ResultviewerPage }])
  ]
})
export class ResultviewerPageModule {}
