import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as Tesseract from 'tesseract.js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test-processing',
  templateUrl: './test-processing.page.html',
  styleUrls: ['./test-processing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule], 
})
export class TestProcessingPage implements OnInit {
  previewImage: string | null = null;
  extractedText: string | null = null;
  extractedData: any[] = [];
  studentName: string | null = null;
  studentScore: string | null = null;

  constructor(private http: HttpClient) {} // ✅ Inject HttpClient correctly

  ngOnInit() {}

  async openCamera() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    this.previewImage = image.dataUrl!;
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async processImage() {
    if (!this.previewImage) return;

    const { data: { text } } = await Tesseract.recognize(this.previewImage, 'eng');
    this.extractedText = text;
    this.extractStudentData(text);
  }

  extractStudentData(text: string) {
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const scoreMatch = text.match(/Score:\s*(\d+)/i);

    this.studentName = nameMatch ? nameMatch[1] : 'Not Found';
    this.studentScore = scoreMatch ? scoreMatch[1] : 'Not Found';

    this.extractedData.push({
      image: this.previewImage,
      text: this.extractedText,
      name: this.studentName,
      score: this.studentScore,
    });
  }

  processTestPaper() {
    const imageUrl = 'uploads/test.jpg';

    this.http.post('http://localhost:5001/process-test-paper', { imageUrl }).subscribe(
      (response) => {
        console.log('✅ Response:', response);
      },
      (error) => {
        console.error('❌ Error:', error);
      }
    );
  }
}
