import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as Tesseract from 'tesseract.js';
import { HttpClient } from '@angular/common/http';

// ... keep your existing imports ...

@Component({
  selector: 'app-test-processing',
  templateUrl: './test-processing.page.html',
  styleUrls: ['./test-processing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TestProcessingPage implements OnInit {
  previewImage: string | null = null;
  extractedText: string | null = null;
  detectedAnswers: string[] = [];
  studentScore: number = -1;

  examTitle: string = '';
  subject: string = '';
  answerKey: string[] = ['D', 'A', 'C', 'B', 'E', 'A', 'D', 'B', 'C', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E'];

  cvReady = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const checkOpenCV = setInterval(() => {
      if ((window as any).cv && typeof (window as any).cv.imread === 'function') {
        this.cvReady = true;
        clearInterval(checkOpenCV);
        console.log('✅ OpenCV.js loaded');
      }
    }, 100);
  }

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
    if (!this.previewImage || !this.cvReady) {
      alert('Image or OpenCV not ready.');
      return;
    }

    const cv = (window as any).cv;
    const imgElement = new Image();
    imgElement.src = this.previewImage;

    imgElement.onload = () => {
      const src = cv.imread(imgElement);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const thresh = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 11, 2);

      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const bubbles = [];

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const rect = cv.boundingRect(cnt);
        const aspectRatio = rect.width / rect.height;
        const area = rect.width * rect.height;

        if (
          area > 300 && area < 1500 &&
          aspectRatio > 0.7 && aspectRatio < 1.3
        ) {
          bubbles.push({
            contour: cnt,
            x: rect.x,
            y: rect.y,
            centerX: rect.x + rect.width / 2,
            centerY: rect.y + rect.height / 2,
            rect: rect
          });
        }
      }

      console.log(`🟢 Total Bubbles: ${bubbles.length}`);

      // Group and sort bubbles
      const sorted = bubbles.sort((a, b) => a.centerY - b.centerY);

      const questionGroups: any[] = [];
      const choicesPerQuestion = 5;

      // Group into 20 questions (each with 5 choices)
      for (let i = 0; i < 20; i++) {
        const row = sorted.slice(i * choicesPerQuestion, (i + 1) * choicesPerQuestion);
        const sortedRow = row.sort((a, b) => a.centerX - b.centerX);
        questionGroups.push(sortedRow);
      }

      const answers: string[] = [];
      const choices = ['A', 'B', 'C', 'D', 'E'];

      for (let qIndex = 0; qIndex < questionGroups.length; qIndex++) {
        const row = questionGroups[qIndex];
        let maxFilled = -1;
        let selectedIndex = -1;

        row.forEach((bubble: any, idx: number) => {

          const roi = thresh.roi(bubble.rect);
          const nonZero = cv.countNonZero(roi);

          if (nonZero > maxFilled) {
            maxFilled = nonZero;
            selectedIndex = idx;
          }
          roi.delete();
        });

        answers.push(choices[selectedIndex] || '');
      }

      this.detectedAnswers = answers;
      this.calculateScore(answers);

      src.delete();
      gray.delete();
      blurred.delete();
      thresh.delete();
      contours.delete();
      hierarchy.delete();
    };
  }

  calculateScore(answers: string[]) {
    let score = 0;
    answers.forEach((ans, i) => {
      if (ans === this.answerKey[i]) {
        score++;
      }
    });
    this.studentScore = score;
    console.log('✅ Answers:', answers);
  }
}
