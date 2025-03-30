import { Routes } from '@angular/router';
import { TestProcessingPage } from './test-processing/test-processing.page';
import { TeacherDashboardPage } from './teacher-dashboard/teacher-dashboard.page';

export const appRoutes: Routes = [
  { path: '/test-processing', component: TestProcessingPage },
  { path: '/teacher-dashboard', component: TeacherDashboardPage },
  { path: '', redirectTo: '/teacher-dashboard', pathMatch: 'full' }
];
