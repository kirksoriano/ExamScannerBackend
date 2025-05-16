import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { BubbleTemplate, bubbles, Option } from '../data/bubble-template'; // Make sure this is correct
import { Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { ResultService } from '../services/result.service';

declare var cv: any;


interface Question {
  questionNumber: number;
  answer: 'A' | 'B' | 'C' | 'D' | 'E'; // or just string if you want more flexibility
}

interface AnswerSheet {
  id: number;
  teacher_id: number;
  exam_title: string;
  subject: string;
  grade_level: string;
  questions: Question[];
}

@Component({
  selector: 'app-test-processing',
  templateUrl: 'test-processing.page.html',
  styleUrls: ['test-processing.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class testprocessingPage implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  

  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  studentPercentage: number = 0;
  classAveragePercentage: number = 0;
  showCamera = false;
  showCroppedImage = false;
  croppedImageUrl: string | null = null;
  cropOpacity = 1;
  score: number = 0;
  results: any[] = [];
  answerKey: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
  detectionBoxes = [
    { x: 0, y: 0, width: 150, height: 150 },
    { x: 0, y: 380, width: 150, height: 150 },
    { x: 330, y: 0, width: 150, height: 150 },
    { x: 330, y: 380, width: 150, height: 150 }
  ];

  detectedContours: any;
  isSheetScanned: boolean = false;
  answers: any[] = [];
  total: number = 0; // <== Add this
  detectedAnswers: { [questionNumber: string]: string | null } = {}; // <== Add this

  hasResults: boolean = false; // Already added for View Results button
  examTitle!: string;
  subject!: string;
  gradeLevel!: string;
  teacherId: string = '1'; // Replace with dynamic user ID later

  goToResultViewer() {
    // navigate with state like in your earlier code
    this.router.navigate(['/resultviewer'], {
      state: {
        score: this.score,
        total: this.total,
        answers: this.detectedAnswers,
        answerKey: this.answerKey,
      },
    });
  }

  constructor(
    private resultService: ResultService,
    private ngZone: NgZone,
    private platform: Platform,
    private router: Router,
    private http: HttpClient,
    private navCtrl: NavController,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit() {
    if (typeof cv === 'undefined') {
      console.error('OpenCV.js is not loaded!');
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.examTitle = params['examTitle'];
      this.subject = params['subject'];
      this.gradeLevel = params['gradeLevel'];
      this.fetchAnswerKey();
    });
  }

  onStartCameraButtonClick() {
    this.showCamera = true;
    setTimeout(() => this.startCameraView(), 0);
  }

  startCameraView() {
    if (!this.videoRef?.nativeElement) {
      alert('Video element not ready');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    }).then((stream) => {
      const video = this.videoRef.nativeElement;
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => {
        video.width = 640;
        video.height = 480;
        this.processVideo();
      };
    }).catch((err) => {
      console.error('Camera error:', err);
      alert('Error accessing camera: ' + err.message);
    });
  }

  fetchAnswerKey() {
    this.http.get<AnswerSheet[]>(`${this.BASE_URL}/answer-sheets`, {
      params: {
        teacher_id: this.teacherId,
        exam_title: this.examTitle,
        subject: this.subject,
        grade_level: this.gradeLevel
      }
    }).subscribe((sheets: AnswerSheet[]) => {
      console.log(sheets);
  
      if (sheets.length > 0) {
        const answerSheet = sheets[0]; // You can also let user choose if needed
        this.answerKey = {};
  
        answerSheet.questions.forEach((q) => {
          this.answerKey[q.questionNumber] = q.answer;
        });
  
        console.log('Answer key loaded:', this.answerKey);
      } else {
        console.warn('No matching answer sheet found.');
      }
    }, error => {
      console.error('Error fetching answer key:', error);
    });
  }
  
  drawDetectionBoxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    this.detectionBoxes.forEach(box => {
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });
    ctx.restore();
  }

  isRectInsideDetectionBoxes(rect: { x: number; y: number; width: number; height: number }) {
    return this.detectionBoxes.some(box => {
      return (
        rect.x >= box.x &&
        rect.y >= box.y &&
        rect.x + rect.width <= box.x + box.width &&
        rect.y + rect.height <= box.y + box.height
      );
    });
  }

  drawBubbleOverlay(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    const circleRadius = 20;
    bubbles.forEach((bubble: BubbleTemplate, index) => {
      let filledCount = 0;
      let correctAnswer = this.answerKey[index + 1];
      let filledOption: Option | null = null;

      for (const option in bubble.options) {
        const opt = option as Option;
        const { cx, cy } = bubble.options[opt];
        const filled = this.isBubbleFilled(ctx, bubble, opt);

        if (filled) {
          filledCount++;
          filledOption = opt;
        }

        let color = 'blue';
        if (filledCount > 1) color = 'red';
        else if (filledOption === correctAnswer) color = 'green';
        else if (filledOption && filledOption !== correctAnswer) color = 'red';
        else if (!filledOption && correctAnswer === opt) color = 'yellow';

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, circleRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  isBubbleFilled(ctx: CanvasRenderingContext2D, bubble: any, option: string): boolean {
    const radius = 10; // adjust depending on bubble size
    const { x, y } = bubble.options[option];
    const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
    let sum = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const brightness = (r + g + b) / 3;
      sum += brightness;
    }
    const averageBrightness = sum / (imageData.data.length / 4);
    return averageBrightness < 150; // threshold: lower = darker = filled
  }
  
  processVideo() {
    try {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    const FPS = 10;
    let stopped = false;

    const process = () => {
      if (stopped) return;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(process);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.drawDetectionBoxes(ctx, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      src.data.set(imageData.data);

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.Canny(blurred, edges, 75, 150);
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let detectedBoxes = new Array(this.detectionBoxes.length).fill(false);

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);

        if (approx.rows === 4 && cv.contourArea(approx) > 250 && cv.isContourConvex(approx)) {
          const rect = cv.boundingRect(approx);

          this.detectionBoxes.forEach((box, idx) => {
            if (
              rect.x >= box.x &&
              rect.y >= box.y &&
              rect.x + rect.width <= box.x + box.width &&
              rect.y + rect.height <= box.y + box.height
            ) {
              detectedBoxes[idx] = true;
              ctx.save();
              ctx.strokeStyle = 'red';
              ctx.lineWidth = 4;
              ctx.globalAlpha = 0.7;
              ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
              ctx.fillStyle = 'rgba(255,0,0,0.2)';
              ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
              ctx.restore();
            }
          });
        }

        approx.delete();
        cnt.delete();
      }

      // In the processVideo function, when all boxes are detected:
      if (detectedBoxes.every(v => v) && !this.croppedImageUrl) {
          stopped = true;
          this.showCamera = false;  // Hide the camera view
          // Stop the camera stream
          if (this.videoRef.nativeElement.srcObject) {
              const stream = this.videoRef.nativeElement.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
          }
          this.detectAndCropPaper();
          return;
      }

      requestAnimationFrame(process);
    };

    requestAnimationFrame(process);
    } catch (error) {
        console.error('Error in processVideo:', error);
    }
    }

    detectAndCropPaper() {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
    
      // Create a temporary canvas for a clean snapshot
      const tempSnapshotCanvas = document.createElement('canvas');
      tempSnapshotCanvas.width = canvas.width;
      tempSnapshotCanvas.height = canvas.height;
      const tempCtx = tempSnapshotCanvas.getContext('2d');
      if (!tempCtx) return;
    
      const video = this.videoRef.nativeElement;
      tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
      let src = cv.imread(tempSnapshotCanvas);
      let dst = new cv.Mat();
    
      const FIXED_WIDTH = 800;
      const FIXED_HEIGHT = Math.round(FIXED_WIDTH * 1.414); // A4 ratio
    
      // Top-left, top-right, bottom-right, bottom-left order
      let srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        this.detectionBoxes[0].x, this.detectionBoxes[0].y,
        this.detectionBoxes[2].x + this.detectionBoxes[2].width, this.detectionBoxes[2].y,
        this.detectionBoxes[3].x + this.detectionBoxes[3].width, this.detectionBoxes[3].y + this.detectionBoxes[3].height,
        this.detectionBoxes[1].x, this.detectionBoxes[1].y + this.detectionBoxes[1].height
      ]);
    
      let dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        FIXED_WIDTH, 0,
        FIXED_WIDTH, FIXED_HEIGHT,
        0, FIXED_HEIGHT
      ]);
    
      let M = cv.getPerspectiveTransform(srcPoints, dstPoints);
      let dsize = new cv.Size(FIXED_WIDTH, FIXED_HEIGHT);
      cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    
      // Show result
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = FIXED_WIDTH;
      outputCanvas.height = FIXED_HEIGHT;
      cv.imshow(outputCanvas, dst);
      this.croppedImageUrl = outputCanvas.toDataURL('image/jpeg');
      this.showCroppedImage = true;
    
      // Overlay bubbles and score answers
      const ctxCropped = outputCanvas.getContext('2d');
      if (ctxCropped) {
        this.drawBubbleOverlay(ctxCropped); // Draws the template bubble overlay
        this.scoreSheet(ctxCropped);        // Detects filled bubbles and scores
      }
    
      // Cleanup
      src.delete(); dst.delete(); M.delete(); srcPoints.delete(); dstPoints.delete();
    }
    
    
  scoreSheet(ctx: CanvasRenderingContext2D) {
    let score = 0;
    const results = bubbles.map((bubble, index) => {
      let correct = 0;
      let incorrect = 0;
      for (const option in bubble.options) {
        const opt = option as Option;
        if (this.isBubbleFilled(ctx, bubble, opt)) {
          const correctAnswer = this.answerKey[index + 1];
          if (correctAnswer === opt) {
            correct++;
            score++;
          } else {
            incorrect++;
          }
        }
      }
      return { question: index + 1, correct, incorrect };
    });

    this.score = score;

    this.router.navigate(['/resultviewer'], {
      state: {
        image: this.croppedImageUrl,
        results: results
      }
    });
  }
    calculateResults(ctx: CanvasRenderingContext2D) {
      let score = 0;
      const results = [];
    
      const totalQuestions = bubbles.length;
      const totalPossibleScore = totalQuestions;
    
      for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];
        const correctAnswer = this.answerKey[bubble.question];
        let markedAnswer: string | null = null;
    
        for (const option in bubble.options) {
          if (this.isBubbleFilled(ctx, bubble, option)) {
            markedAnswer = option;
            break;
          }
        }
    
        const isCorrect = markedAnswer === correctAnswer;
        if (isCorrect) score++;
    
        results.push({
          question: bubble.question,
          marked: markedAnswer,
          correctAnswer: correctAnswer,
          correct: isCorrect
        });
      }
    
      const studentPercentage = (score / totalPossibleScore) * 100;
    
      // === Placeholder: Replace with actual class average later ===
      const classScores = [85, 76, 92, 88]; // Example
      const classAveragePercentage = classScores.reduce((a, b) => a + b, 0) / classScores.length;
    
      this.score = score;
      this.results = results;
    
      // Log or store it for use in result viewer
      this.studentPercentage = studentPercentage;
      this.classAveragePercentage = classAveragePercentage;
    
      console.log('Score:', score);
      console.log('Student %:', studentPercentage);
      console.log('Class Avg %:', classAveragePercentage);
    
      return results;
    }
    
    reset() {
        this.showCamera = false;
        this.showCroppedImage = false;
        this.croppedImageUrl = null;
        if (this.videoRef && this.videoRef.nativeElement && this.videoRef.nativeElement.srcObject) {
          const stream = this.videoRef.nativeElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          this.videoRef.nativeElement.srcObject = null;
        }
      }
}


