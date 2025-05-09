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
      try {
        // ✅ SET LICENSE FIRST — before initialize or loadWasm
        await (DocumentNormalizer as any).initLicense('t00832gAAAFLnm+ZnlPj+87sBek8VtyO7/LHApZMtBrFkWKyr3d3bXltQ66o0Nhh2brFy7ltxUwu+gwEtOJqYUgEfKeIsVR4UOP5/ZtpQY47pD1BYKts=');

        // Then initialize (optional based on plugin version)
        await DocumentNormalizer.initialize();

        console.log('DocumentNormalizer initialized successfully.');
      } catch (error) {
        console.error('DocumentNormalizer init error:', error);
      }
    }
  }
}