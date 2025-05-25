import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { BubbleTemplate, bubbles, Option, BubbleCoordinate } from '../data/bubble-template';
import { Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { ResultService } from '../services/result.service';
import { Chart } from 'chart.js';

declare var cv: any;


interface Question {
  questionNumber: number;
  answer: 'A' | 'B' | 'C' | 'D'; // or just string if you want more flexibility
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
export class TestProcessingPage implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  canvasWidth = 800;
  canvasHeight = Math.round(800 * 1.414);
  
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  chart: Chart | undefined;
  chartInstance: any = null;
  scannedImageUrl: string | null = null;
  studentPercentage: number = 0;
  classAveragePercentage: number = 0;
  showCamera = false;
  showCroppedImage = false;
  croppedImageUrl: string | null = null;
  cropOpacity = 1;
  score: number = 0;
  results: any[] = [];
  answerKey: Record<string, string> = {};
  detectionBoxes = [
    { x: 0, y: 0, width: 150, height: 150 },
    { x: 0, y: 380, width: 150, height: 150 },
    { x: 330, y: 0, width: 150, height: 150 },
    { x: 330, y: 380, width: 150, height: 150 }
  ];

  detectedContours: any;
  isSheetScanned: boolean = false;
  answers: any[] = [];
  total: number = 0;
  detectedAnswers: { [questionNumber: string]: string | null } = {};
  hasResults: boolean = false;
  examTitle!: string;
  subject!: string;
  gradeLevel!: string;
  teacherId: string = '1'; // Replace with actual teacher id

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
      alert('OpenCV.js is not loaded!');
      return;
    }

    // Remove the hardcoded answer key initialization
    // for (let i = 1; i <= 20; i++) {
    //     this.answerKey[i.toString()] = 'A';
    // }
    // alert('✅ Fixed test answer key: ' + JSON.stringify(this.answerKey));

    // Optionally, trigger overlay drawing if you want to see it immediately
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.drawBubbleOverlay(ctx);
      }
    }

    // Load teacher ID from local storage (like in answer.page.ts)
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.teacherId = user.id;
      alert('✅ Teacher ID loaded: ' + this.teacherId);
    } else {
      // Optionally handle missing user data
      alert('No user data found in local storage.');
    }

    this.route.queryParams.subscribe(params => {
      const answerSheetId = params['answerSheetId'];
      if (answerSheetId) {
        this.loadAnswerSheet(answerSheetId);
      }

      this.examTitle = params['examTitle'];
      this.subject = params['subject'];
      this.gradeLevel = params['gradeLevel'];
      this.getAnswerSheets();
    });
  }
  answerSheets: AnswerSheet[] = [];
  loadAnswerSheet(id: number) {
    this.http.get(`${this.BASE_URL}/answer-sheets/${id}`).subscribe((sheet: any) => {
        alert(`Loaded answer sheet: ${sheet.exam_title}`); // Alert the exam title
        sheet.questions.forEach((q: any) => {
            this.answerKey[q.questionNumber] = q.answer;
        });
        alert(`Answer key loaded for ${sheet.questions.length} questions`); // Alert the number of questions
        // After loading the answer key, redraw overlays
        const ctx = this.canvasRef?.nativeElement?.getContext('2d');
        if (ctx) {
            this.drawBubbleOverlay(ctx);
        }
    }, (error) => {
        alert(`Error loading answer sheet: ${error.message}`); // Alert any errors
    });
}

  getAnswerSheets() {
    if (!this.teacherId) {
      alert('Teacher not logged in.');
      return;
    }
  
    this.http.get(`${this.BASE_URL}/answer-sheets?teacher_id=${this.teacherId}`).subscribe(
      (response: any) => {
        alert("✅ Fetched answer sheets: " + JSON.stringify(response));
        this.answerSheets = response;
      },
      (error) => {
        alert("❌ Error fetching answer sheets: " + error.message);
      }
    );
  }
  goToResultViewer() {
    this.router.navigate(['/resultviewer'], {
      state: {
        score: this.score,
        total: this.total,
        answers: this.detectedAnswers,
        answerKey: this.answerKey,
        results: this.results // Make sure this is filled with analysis data
      },
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


  
  processVideo() {
    try {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Could not get canvas context');
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
    let stopped = false; // <-- Move this line outside the process() function

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
          // REMOVE or COMMENT OUT these lines:
          // this.showCamera = false;  // Hide the camera view
          // if (this.videoRef.nativeElement.srcObject) {
          //     const stream = this.videoRef.nativeElement.srcObject as MediaStream;
          //     stream.getTracks().forEach(track => track.stop());
          // }
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
      alert('detectAndCropPaper called');
      try {
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('No canvas context');
          return;
        }

        // Read image from canvas
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

        // Find marker corners in each detection region
        const markerCorners: {x: number, y: number}[] = [];
        for (const box of this.detectionBoxes) {
          const roi = gray.roi(new cv.Rect(box.x, box.y, box.width, box.height));
          const roiContours = new cv.MatVector();
          const roiHierarchy = new cv.Mat();
          cv.Canny(roi, roi, 75, 150);
          cv.findContours(roi, roiContours, roiHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

          // Find the largest quadrilateral contour in this region
          let maxArea = 0;
          let bestQuad: any = null;
          for (let i = 0; i < roiContours.size(); i++) {
            const cnt = roiContours.get(i);
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
            if (approx.rows === 4 && cv.isContourConvex(approx)) {
              const area = cv.contourArea(approx);
              if (area > maxArea) {
                maxArea = area;
                bestQuad = [];
                for (let j = 0; j < 4; j++) {
                  const pt = approx.data32S.slice(j * 2, j * 2 + 2);
                  bestQuad.push({ x: pt[0] + box.x, y: pt[1] + box.y });
                }
              }
            }
            approx.delete();
            cnt.delete();
          }

          // Pick the corner of the quad that is closest to the logical region corner
          if (bestQuad) {
            // For each region, pick the logical corner:
            // 0: top-left, 1: bottom-left, 2: top-right, 3: bottom-right
            let target;
            if (box.x < canvas.width / 2 && box.y < canvas.height / 2) target = { x: box.x, y: box.y }; // top-left
            else if (box.x < canvas.width / 2) target = { x: box.x, y: box.y + box.height }; // bottom-left
            else if (box.y < canvas.height / 2) target = { x: box.x + box.width, y: box.y }; // top-right
            else target = { x: box.x + box.width, y: box.y + box.height }; // bottom-right

            // Find the quad point closest to the target
            let minDist = Infinity, chosen = bestQuad[0];
            for (const pt of bestQuad) {
              const dist = Math.hypot(pt.x - target.x, pt.y - target.y);
              if (dist < minDist) {
                minDist = dist;
                chosen = pt;
              }
            }
            markerCorners.push(chosen);
          } else {
            // Fallback: use box corner
            markerCorners.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
          }

          roi.delete();
          roiContours.delete();
          roiHierarchy.delete();
        }
        gray.delete();

        if (markerCorners.length !== 4) {
          console.error('Could not detect all marker corners');
          return;
        }

        // Order corners: [top-left, top-right, bottom-right, bottom-left]
        // You may need to sort markerCorners based on their positions
        markerCorners.sort((a, b) => a.y - b.y);
        const top = markerCorners.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = markerCorners.slice(2, 4).sort((a, b) => a.x - b.x);
        const ordered = [top[0], top[1], bottom[1], bottom[0]];

        // Perspective transform
        const FIXED_WIDTH = 800;
        const FIXED_HEIGHT = Math.round(800 * 1.414); // A4 ratio

        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          ordered[0].x, ordered[0].y, // top-left
          ordered[1].x, ordered[1].y, // top-right
          ordered[2].x, ordered[2].y, // bottom-right
          ordered[3].x, ordered[3].y  // bottom-left
        ]);
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          FIXED_WIDTH, 0,
          FIXED_WIDTH, FIXED_HEIGHT,
          0, FIXED_HEIGHT
        ]);
        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const dst = new cv.Mat();
        const dsize = new cv.Size(FIXED_WIDTH, FIXED_HEIGHT);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // Draw result on canvas
        canvas.width = FIXED_WIDTH;
        canvas.height = FIXED_HEIGHT;
        cv.imshow(canvas, dst);

        // Get the context again after imshow
        const overlayCtx = canvas.getContext('2d');
        if (overlayCtx) {
          // After cropping and perspective transform:
          this.drawBubbleOverlay(overlayCtx); // <-- Call it here with the correct context
          overlayCtx.font = 'bold 32px Arial';
          overlayCtx.fillStyle = 'black';
          overlayCtx.fillText(`Score: ${this.score} / ${this.total}`, 20, 50);
        }

        // Now convert to image and display
        //this.ngZone.run(() => {
          //this.croppedImageUrl = canvas.toDataURL('image/png');
          //this.showCroppedImage = true;
          //this.cropOpacity = 1;
          //this.hasResults = true;
        //});

        // Clean up
        src.delete();
        dst.delete();
        srcPoints.delete();
        dstPoints.delete();
        M.delete();

        alert('Cropped image set, showCroppedImage: ' + this.showCroppedImage + ', croppedImageUrl: ' + this.croppedImageUrl);

      } catch (err) {
        const errorMessage = (err as Error).message; // Cast err to Error
        alert('Error in detectAndCropPaper: ' + errorMessage);
        this.ngZone.run(() => {
            this.showCroppedImage = false;
            this.croppedImageUrl = null;
            this.hasResults = false;
        });
    }
  }
    drawBubbleOverlay(ctx: CanvasRenderingContext2D) {
        // Reset detected answers
        this.detectedAnswers = {};
    
        // Iterate over each bubble
        bubbles.forEach((bubble, index) => {
            let filledOptions: Option[] = [];
            for (const opt in bubble.options) {
                const option = opt as Option;
                const filled = this.isBubbleFilled(ctx, bubble, option);
                if (filled) {
                    filledOptions.push(option);
                }
            }

            // Determine the correct answer
            const correctAnswer = this.answerKey[index] as Option;
        
            // Draw overlays based on correctness
            filledOptions.forEach((option: Option) => {
                // When iterating through bubbles and options:
                const validOptions = ['A', 'B', 'C', 'D'];
                
                bubbles.forEach((bubble, i) => {
                    filledOptions.forEach(option => {
                        const filledBubbleCoordinate = bubble.options[option];
                        if (!filledBubbleCoordinate || filledBubbleCoordinate.cx === undefined || filledBubbleCoordinate.cy === undefined || filledBubbleCoordinate.radius === undefined) {
                            alert(`Missing or malformed filledBubbleCoordinate for option ${option} in question ${i + 1}`);
                            return;
                        }
                        alert(`Mapping filled option: question ${i + 1}, option: ${option}, cx: ${filledBubbleCoordinate.cx}, cy: ${filledBubbleCoordinate.cy}, radius: ${filledBubbleCoordinate.radius}`);
                        ctx.fillRect(
                            filledBubbleCoordinate.cx - filledBubbleCoordinate.radius,
                            filledBubbleCoordinate.cy - filledBubbleCoordinate.radius,
                            filledBubbleCoordinate.radius * 2,
                            filledBubbleCoordinate.radius * 2
                        );
                    });
                    const correctBubbleCoordinate = bubble.options[correctAnswer];
                    if (!correctBubbleCoordinate || correctBubbleCoordinate.cx === undefined || correctBubbleCoordinate.cy === undefined || correctBubbleCoordinate.radius === undefined) {
                        alert(`Missing or malformed correctBubbleCoordinate for correctAnswer ${correctAnswer} in question ${i + 1}`);
                        return;
                    }
                    alert(`Mapping correct answer: question ${i + 1}, correctAnswer: ${correctAnswer}, cx: ${correctBubbleCoordinate.cx}, cy: ${correctBubbleCoordinate.cy}, radius: ${correctBubbleCoordinate.radius}`);
                    ctx.fillRect(
                        correctBubbleCoordinate.cx - correctBubbleCoordinate.radius,
                        correctBubbleCoordinate.cy - correctBubbleCoordinate.radius,
                        correctBubbleCoordinate.radius * 2,
                        correctBubbleCoordinate.radius * 2
                    );
                });
            });
        });
    }

    isBubbleFilled(ctx: CanvasRenderingContext2D, bubble: BubbleTemplate, option: Option): boolean {
        const { cx, cy, radius } = bubble.options[option] as BubbleCoordinate;
        const imageData = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2);
        const gray = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC1);
        cv.cvtColor(cv.matFromImageData(imageData), gray, cv.COLOR_RGBA2GRAY);
    
        const THRESHOLD_DARKNESS = 150;  // below this = dark
        const FILL_PERCENT = 0.5;        // >50% dark = filled
        let darkPixels = 0;
    
        for (let i = 0; i < gray.rows; i++) {
            for (let j = 0; j < gray.cols; j++) {
                const pixel = gray.ucharPtr(i, j)[0]; // Grayscale value
                if (pixel < THRESHOLD_DARKNESS) {
                    darkPixels++;
                }
            }
          }
    
        const totalPixels = gray.rows * gray.cols;
        gray.delete();
    
        return (darkPixels / totalPixels) > FILL_PERCENT;
    
    }
    extractAnswersFromCroppedImage(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
    
      this.detectedAnswers = {};
      this.score = 0;
      this.total = bubbles.length;
    
      bubbles.forEach((bubble, index) => {
        let selected: Option | null = null;
        let filledCount = 0;
    
        for (const opt in bubble.options) {
          const option = opt as Option;
          const filled = this.isBubbleFilled(ctx, bubble, option);
          if (filled) {
            filledCount++;
            selected = option; // Ensure 'option' is of type 'Option'
          }
        }
    
        const qNum = index + 1;
        if (filledCount === 1) {
          this.detectedAnswers[qNum.toString()] = selected!;
          if (this.answerKey[qNum] === selected) {
            this.score++;
          }
        } else {
          this.detectedAnswers[qNum.toString()] = null;
        }
      });
    
        alert('Answers: ' + JSON.stringify(this.detectedAnswers));
        alert('Score: ' + this.score + ' / ' + this.total);
        this.hasResults = true;
        this.goToResultViewer();
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
        let markedAnswer: Option | null = null; // Ensure markedAnswer is of type Option

        for (const option in bubble.options) {
          if (this.isBubbleFilled(ctx, bubble, option as Option)) { // Cast option to Option
            markedAnswer = option as Option; // Cast option to Option
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

      alert('Score: ' + this.score);
      alert('Student %: ' + this.studentPercentage);
      alert('Class Avg %: ' + this.classAveragePercentage);

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


  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const questions = Object.keys(this.detectedAnswers).sort((a, b) => +a - +b);
    const answerOptions = ['A', 'B', 'C', 'D'];
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b'];

    const answerCounts = questions.map(q => {
      const answer = this.detectedAnswers[q];
      return answerOptions.map(opt => (answer === opt ? 1 : 0));
    });

    alert('Chart Data: ' + JSON.stringify(answerCounts));

    const datasets = answerOptions.map((option, idx) => ({
      label: `Option ${option}`,
      data: answerCounts.map(counts => counts[idx]),
      backgroundColor: colors[idx],
    }));
    const ctx = document.getElementById('answersChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: questions.map(q => `Q${q}`),
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Answer Distribution per Question',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Number of Students',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Questions',
            },
          },
        },
      },
    });
  }

  // Call renderChart() after processing results
  processResultsAndShowChart() {
    // ... your logic to fill detectedAnswers/results ...
    this.renderChart();
  }
}

