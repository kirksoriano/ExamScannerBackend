import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    if (Capacitor.getPlatform() === 'web') {
      
    }
  }
}