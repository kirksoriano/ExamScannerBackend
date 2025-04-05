import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as Tesseract from 'tesseract.js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test-processing',
  templateUrl: './test-processing.page.html',
  styleUrls: ['./test-processing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TestProcessingPage implements OnInit {
  BASE_URL = 'https://examscannerbackend-production.up.railway.app';

  previewImage: string | null = null;
  extractedText: string | null = null;
  detectedAnswers: string[] = [];
  studentScore: number = -1;

  examTitle: string = '';
  subject: string = '';
  answerKey: string[] = ['A', 'B', 'C', 'D', 'A'];

  cvReady = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const checkOpenCV = setInterval(() => {
      if ((window as any).cv && typeof (window as any).cv.imread === 'function') {
        this.cvReady = true;
        clearInterval(checkOpenCV);
        console.log('✅ OpenCV.js is fully loaded and ready!');
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
    if (!this.previewImage) return;

    if (!this.cvReady) {
      alert('⏳ OpenCV is still loading. Please try again shortly.');
      return;
    }

    // OCR with Tesseract.js
    const {
      data: { text },
    } = await Tesseract.recognize(this.previewImage, 'eng');
    this.extractedText = text;
    this.extractAnswers(text);

    // OpenCV Logic
    const imgElement = new Image();
    imgElement.src = this.previewImage;
    imgElement.onload = () => {
      try {
        const cv = (window as any).cv;
        const src = cv.imread(imgElement);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const thresh = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
    
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
        let bubbles: any[] = [];
    
        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          const rect = cv.boundingRect(cnt);
          const aspectRatio = rect.width / rect.height;
    
          if (rect.width > 10 && rect.width < 60 && aspectRatio >= 0.6 && aspectRatio <= 1.4) {
            bubbles.push({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              area: cv.contourArea(cnt),
              rect: rect,
            });
          }
    
          cnt.delete();
        }
    
        // Group bubbles by rows based on Y-coordinate (fuzzy match)
        bubbles.sort((a, b) => a.y - b.y);
        let rows: any[][] = [];
        let currentRow: any[] = [];
    
        let lastY = null;
        for (const bubble of bubbles) {
          if (lastY === null || Math.abs(bubble.y - lastY) < 20) {
            currentRow.push(bubble);
          } else {
            rows.push(currentRow);
            currentRow = [bubble];
          }
          lastY = bubble.y;
        }
        if (currentRow.length > 0) rows.push(currentRow);
    
        // Sort each row left to right and find filled bubbles
        const answers: string[] = [];
    
        rows.forEach((row, rowIndex) => {
          if (row.length < 2) return; // Ignore incomplete rows
          row.sort((a, b) => a.x - b.x);
    
          // Choose filled bubble by pixel intensity inside bounding box
          let maxNonZero = -1;
          let selectedIndex = -1;
    
          row.forEach((bubble, i) => {
            const roi = thresh.roi(new cv.Rect(bubble.x, bubble.y, bubble.width, bubble.height));
            const nonZero = cv.countNonZero(roi);
            roi.delete();
    
            if (nonZero > maxNonZero) {
              maxNonZero = nonZero;
              selectedIndex = i;
            }
          });
    
          const letters = ['A', 'B', 'C', 'D', 'E'];
          answers.push(letters[selectedIndex] || '?');
        });
    
        this.detectedAnswers = answers;
        this.calculateScore(answers);
        console.log('✅ Final Answers from Image:', answers);
    
        // Cleanup
        src.delete(); gray.delete(); blurred.delete(); thresh.delete();
        contours.delete(); hierarchy.delete();
      } catch (err) {
        console.error('❌ OpenCV error during image processing:', err);
      }
    };
    
  }

  extractAnswers(text: string) {
    const answerPattern = /Q(\d+):\s([A-D])/g;
    let match;
    const extracted: string[] = [];

    while ((match = answerPattern.exec(text)) !== null) {
      extracted.push(match[2]);
    }

    this.detectedAnswers = extracted;
    this.calculateScore(extracted);
  }

  calculateScore(answers: string[]) {
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === this.answerKey[idx]) {
        score++;
      }
    });
    this.studentScore = score;
    console.log('✅ Detected Answers:', answers);
  }
}
