import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

declare var cv: any; // Declare cv to avoid TypeScript errors

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnswerPage {
  BASE_URL = 'https://examscannerbackend-production.up.railway.app';

  examTitle = '';
  subject = '';
  gradeLevel = '';
  numQuestions = 0;
  questions: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D', 'True', 'False']; // Supports MCQs & True/False

  answerSheets: any[] = []; // Array to store fetched answer sheets

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAnswerSheets(); // Fetch answer sheets when the page loads
  }

  // Generate answer input fields when number of questions is entered
  generateAnswerFields() {
    this.questions = Array.from({ length: this.numQuestions }, (_, i) => ({
      questionNumber: i + 1,
      answer: ''
    }));
  }

  // Save the answer sheet to the database
  saveAnswerSheet() {
    const answerSheetData = {
      examTitle: this.examTitle,
      subject: this.subject,
      gradeLevel: this.gradeLevel,
      questions: this.questions
    };

    this.http.post(`${this.BASE_URL}/answer-sheets`, answerSheetData).subscribe(
      response => {
        console.log('✅ Answer sheet saved:', response);
        alert('Answer sheet saved successfully!');
        this.getAnswerSheets(); // Refresh the list after saving
      },
      error => {
        console.error('❌ Error saving answer sheet:', error);
        alert('Failed to save answer sheet.');
      }
    );
  }

  // Fetch saved answer sheets from the server
  getAnswerSheets() {
    this.http.get(`${this.BASE_URL}/answer-sheets`).subscribe(
      (response: any) => {
        console.log("✅ Fetched answer sheets:", response);
        this.answerSheets = response;
      },
      (error) => {
        console.error("❌ Error fetching answer sheets:", error);
        alert("Failed to fetch answer sheets.");
      }
    );
  }

  // Handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processImage(file);
    }
  }

  // Process image using OpenCV.js
  processImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = this.canvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          // Convert to grayscale and process using OpenCV.js
          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          // Threshold to make the bubbles clearer
          const thresh = new cv.Mat();
          cv.threshold(gray, thresh, 150, 255, cv.THRESH_BINARY_INV);

          // Detect circles (answer bubbles)
          const circles = new cv.Mat();
          cv.HoughCircles(thresh, circles, cv.HOUGH_GRADIENT, 1, 20, 100, 30, 10, 30);

          console.log('Detected circles:', circles.data32F);

          // Cleanup
          src.delete();
          gray.delete();
          thresh.delete();
          circles.delete();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
