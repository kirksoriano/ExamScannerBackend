import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home', // Redirect root to home
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'teacher-dashboard',
    loadChildren: () =>
      import('./teacher-dashboard/teacher-dashboard.module').then(
        (m) => m.TeacherDashboardPageModule
      ),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./profile/profile.module').then((m) => m.ProfilePageModule),
  },
  
  {
    path: 'students',
    loadComponent: () =>
      import('./students/students.page').then((m) => m.StudentsPage),
  },
    
  {
    path: 'tos',
    loadChildren: () =>
      import('./tos/tos.module').then((m) => m.TosPageModule),
  },
  {
    path: 'test-processing',
    loadChildren: () =>
      import('./test-processing/test-processing.module').then(
        (m) => m.TestProcessingPageModule
      ),
  },
  {
    path: 'answer',
    loadChildren: () => import('./answer/answer.module').then( (m) => m.AnswerPageModule)
  },

  {
    path: 'resultviewer',
    loadChildren: () => import('./resultviewer/resultviewer.module').then( m => m.ResultviewerPageModule)
  },
  {
    path: 'tester',
    loadChildren: () => import('./tester/tester.module').then( m => m.TesterPageModule)
  },
  {
    path: 'cropper',
    loadChildren: () => import('./cropper/cropper.module').then( m => m.CropperPageModule)
  },
  {
    path: 'question-generator',
    loadChildren: () => import('./question-generator/question-generator.module').then( m => m.QuestionGeneratorPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
