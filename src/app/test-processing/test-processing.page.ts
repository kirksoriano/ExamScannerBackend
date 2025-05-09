// ✅ Updated: Test Processing with Circle Detection, Warp, Fixed Coordinates, Scoring, OCR, and Overlays

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { bubbles, Option } from '../data/bubble-template';
declare var cv: any;

@Component({
  selector: 'app-test-processing',
  templateUrl: './test-processing.page.html',
  styleUrls: ['./test-processing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TestProcessingPage implements OnInit {
  @ViewChild('overlayCanvas', { static: false }) overlayCanvas!: ElementRef<HTMLCanvasElement>;

  previewImage: string | null = null; 
  extractedText: string | null = null;
  detectedAnswers: (Option | null)[] = [];
  studentScore: number = -1;

  examTitle: string = '';
  subject: string = '';
  studentName: string = '';
  studentId: string = '';

  answerKey: Option[] = ['D', 'A', 'C', 'B', 'A', 'A', 'D', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'A', 'B', 'C', 'D', 'A'];
  bubbleRadius: number = 40;

  showOverlayCanvas = true;
  cvReady = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const check = setInterval(() => {
      if ((window as any).cv && (window as any).cv.imread) {
        this.cvReady = true;
        clearInterval(check);
        console.log('✅ OpenCV.js ready');
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

  calculateScore(answers: (Option | null)[]) {
    this.studentScore = answers.reduce((score, ans, i) =>
      ans === this.answerKey[i] ? score + 1 : score, 0);
    console.log('✅ Answers:', answers);
    console.log('🎯 Score:', this.studentScore);
  }

  async processImage() {
    if (!this.previewImage || !this.cvReady) {
      alert('❌ Image or OpenCV not ready.');
      return;
    }

    const cv = (window as any).cv;
    const img = new Image();
    img.src = this.previewImage;

    img.onload = () => {
      const src = cv.imread(img);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edged = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      const canvas = this.overlayCanvas.nativeElement;
      canvas.width = src.cols;
      canvas.height = src.rows;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      try {
        // 1. Edge Detection and Contour Finding
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.Canny(blurred, edged, 50, 150);
        cv.findContours(edged, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const boxes = [];
        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          if (cv.contourArea(cnt) < 1000) continue;
          const rotated = cv.minAreaRect(cnt);
          const points = cv.RotatedRect.points(rotated).map((pt: any) => ({ x: pt.x, y: pt.y }));
          boxes.push({ points, area: cv.contourArea(cnt) });
        }

        const top4 = boxes.sort((a, b) => b.area - a.area).slice(0, 4);
        if (top4.length < 4) {
          alert('❌ Not enough corner markers detected.');
          return;
        }

        const centers = top4.map(b => this.getBoxCenter(b.points));
        const sortedCorners = this.sortCorners(centers, src.cols, src.rows);

        // 2. Perspective Correction
        const flat = sortedCorners.flatMap(p => [p.x, p.y]);
        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, flat);
        const dstSize = new cv.Size(1000, 1414);
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          dstSize.width, 0,
          dstSize.width, dstSize.height,
          0, dstSize.height
        ]);


        // 3. Detect Bubbles
        this.detectedAnswers = bubbles.map((row, qIdx) => {
          let maxVal = -Infinity;
          let selected: Option | null = null;

          for (const opt of ['A', 'B', 'C', 'D'] as Option[]) {
            const bubble = row.options[opt];
            const x = Math.max(0, bubble.cx - this.bubbleRadius);
            const y = Math.max(0, bubble.cy - this.bubbleRadius);


            try {

              const grayROI = new cv.Mat();
              cv.cvtColor( grayROI, cv.COLOR_RGBA2GRAY);
              const mean = cv.mean(grayROI)[0];
              if (255 - mean > maxVal && 255 - mean > 30) {
                maxVal = 255 - mean;
                selected = opt;
              }
              grayROI.delete();
            } catch (e) {
              console.warn(`⚠️ ROI error Q${qIdx + 1}${opt}:`, e);
            }
          }

          return selected;
        });

        this.calculateScore(this.detectedAnswers);

        // 4. Draw Overlay
        cv.imshow(canvas);
        ctx.font = '24px Arial';
        this.detectedAnswers.forEach((ans, i) => {
          const correct = this.answerKey[i];
          const color = ans === correct ? 'green' : ans ? 'red' : 'yellow';
          const bubble = bubbles[i].options[ans ?? 'A'];
          ctx.beginPath();
          ctx.arc(bubble.cx, bubble.cy, this.bubbleRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.stroke();
        });

        // 5. Cleanup
        [src, gray, blurred, edged, contours, hierarchy, srcCoords, dstCoords].forEach(m => m.delete());

      } catch (err) {
        console.error('❌ Processing error:', err);
      }
    };
  }

  

  extractName(text: string): string {
    const match = text.match(/Name\s*:\s*(.*)/i);
    return match ? match[1].trim() : '';
  }

  extractId(text: string): string {
    const match = text.match(/ID\s*:\s*(\d+)/i);
    return match ? match[1].trim() : '';
  }

  getBoxCenter(points: { x: number, y: number }[]): { x: number, y: number } {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / 4, y: sum.y / 4 };
  }

  sortCorners(points: { x: number, y: number }[], width: number, height: number) {
    const topLeft = points.reduce((a, b) => a.x + a.y < b.x + b.y ? a : b);
    const bottomRight = points.reduce((a, b) => a.x + a.y > b.x + b.y ? a : b);
    const topRight = points.reduce((a, b) => a.x - a.y > b.x - b.y ? a : b);
    const bottomLeft = points.reduce((a, b) => a.y - a.x > b.y - b.x ? a : b);
    return [topLeft, topRight, bottomRight, bottomLeft];
  }
}
