import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
// src/opencv.d.ts
declare var cv: any;


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
