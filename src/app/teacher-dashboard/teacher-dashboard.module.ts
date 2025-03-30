import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TeacherDashboardPageRoutingModule } from './teacher-dashboard-routing.module';
import { TeacherDashboardPage } from './teacher-dashboard.page';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // ✅ Ensure this is included
    TeacherDashboardPageRoutingModule,
    RouterModule.forChild([{ path: '', component: TeacherDashboardPage }])
  ]
})
export class TeacherDashboardPageModule {}
