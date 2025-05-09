import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Router } from '@angular/router';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-tester',
  templateUrl: './tester.page.html',
  styleUrls: ['./tester.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TesterPage {
  constructor(private router: Router) {
  }

  async scan() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });

    if (image) {
      this.router.navigate(['/cropper'], {
        state: {
          image: image,
        },
      });
    }
  }
}