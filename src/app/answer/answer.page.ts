import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

declare var cv: any; // Declare cv to avoid TypeScript errors

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnswerPage implements OnInit {
  BASE_URL = 'https://examscannerbackend-production.up.railway.app';

  examTitle = '';
  subject = '';
  gradeLevel = '';
  numQuestions = 0;
  questions: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D', 'True', 'False'];

  answerSheets: any[] = [];
  selectedAnswerSheet: any = null;

  teacherId: any;

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      this.navCtrl.navigateRoot('/home');
      return;
    }

    const user = JSON.parse(userData);
    this.teacherId = user.id;
    console.log('✅ Teacher ID loaded:', this.teacherId);

    this.getAnswerSheets();
  }

  generateAnswerFields() {
    this.questions = Array.from({ length: this.numQuestions }, (_, i) => ({
      questionNumber: i + 1,
      answer: ''
    }));
  }
  
  saveAnswerSheet() {
    if (!this.teacherId) {
      alert('Teacher not logged in.');
      return;
    }
  
    const answerSheetData = {
      examTitle: this.examTitle,      // ✅ Use camelCase
      subject: this.subject,
      gradeLevel: this.gradeLevel,    // ✅ Use camelCase
      questions: this.questions,
      teacherId: this.teacherId       // ✅ Use camelCase
    };
  
    this.http.post(`${this.BASE_URL}/answer-sheets`, answerSheetData).subscribe(
      response => {
        console.log('✅ Answer sheet saved:', response);
        alert('Answer sheet saved successfully!');
        this.getAnswerSheets();
        this.resetForm();
      },
      error => {
        console.error('❌ Error saving answer sheet:', error);
        console.error('Error details:', error.error);
        alert('Failed to save answer sheet.');
      }
    );
  }
  
  getAnswerSheets() {
    if (!this.teacherId) {
      alert('Teacher not logged in.');
      return;
    }
  
    this.http.get(`${this.BASE_URL}/answer-sheets?teacher_id=${this.teacherId}`).subscribe(
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
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processImage(file);
    }
  }

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

          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          const thresh = new cv.Mat();
          cv.threshold(gray, thresh, 150, 255, cv.THRESH_BINARY_INV);

          const circles = new cv.Mat();
          cv.HoughCircles(thresh, circles, cv.HOUGH_GRADIENT, 1, 20, 100, 30, 10, 30);

          console.log('Detected circles:', circles.data32F);

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

  editAnswerSheet(answerSheet: any) {
    this.selectedAnswerSheet = answerSheet;
    this.examTitle = answerSheet.examTitle;
    this.subject = answerSheet.subject;
    this.gradeLevel = answerSheet.gradeLevel;
    this.numQuestions = answerSheet.questions.length;
    this.questions = [...answerSheet.questions];
  }

  updateAnswerSheet() {
    if (!this.selectedAnswerSheet) {
      alert('No answer sheet selected for editing.');
      return;
    }

    const updatedData = {
      examTitle: this.examTitle,
      subject: this.subject,
      gradeLevel: this.gradeLevel,
      questions: this.questions
    };

    this.http.put(`${this.BASE_URL}/answer-sheets/${this.selectedAnswerSheet.id}`, updatedData).subscribe(
      response => {
        console.log('✅ Answer sheet updated:', response);
        alert('Answer sheet updated successfully!');
        this.getAnswerSheets();
        this.selectedAnswerSheet = null;
        this.resetForm();
      },
      error => {
        console.error('❌ Error updating answer sheet:', error);
        alert('Failed to update answer sheet.');
      }
    );
  }

  deleteAnswerSheet(answerSheetId: number) {
    this.http.delete(`${this.BASE_URL}/answer-sheets/${answerSheetId}`).subscribe(
      response => {
        console.log('✅ Answer sheet deleted:', response);
        alert('Answer sheet deleted successfully!');
        this.getAnswerSheets();
      },
      error => {
        console.error('❌ Error deleting answer sheet:', error);
        alert('Failed to delete answer sheet.');
      }
    );
  }

  resetForm() {
    this.examTitle = '';
    this.subject = '';
    this.gradeLevel = '';
    this.numQuestions = 0;
    this.questions = [];
  }
}
