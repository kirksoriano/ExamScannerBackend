import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BubbleTemplate, Option, bubbles, BubbleCoordinate } from '../data/bubble-template'; // Import BubbleTemplate and Option

declare var cv: any; // Declare cv to avoid TypeScript errors

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnswerPage implements OnInit {
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';


  examTitle = '';
  subject = '';
  gradeLevel = '';
  numQuestions = 0;
  questions: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D'];

  

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

  answerKey: Record<number, 'A' | 'B' | 'C' | 'D'> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' }; // Example answer key
  // Ensure this matches the actual answer sheet format

  generateAnswerFields() {
    this.questions = Array.from({ length: this.numQuestions }, (_, i) => ({
      questionNumber: i + 1,
      answer: ''
    }));
    
  }

  isBubbleFilled(ctx: CanvasRenderingContext2D, bubble: BubbleTemplate, option: Option): boolean {
    const { cx, cy, radius } = bubble.options[option];
    const imageData = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2);
    let filledPixels = 0;
    const totalPixels = radius * radius * Math.PI;
    const threshold = 0.4; // Adjust this value to ensure darkness

    for (let i = 0; i < imageData.data.length; i += 4) {
        const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        if (brightness < 100) { // Adjust this value to ensure darkness
            filledPixels++;
        }
    }

    return (filledPixels / totalPixels) > threshold;
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

  editAnswerSheet(answerSheet: any) {
    this.selectedAnswerSheet = answerSheet;
    this.examTitle = answerSheet.exam_title;       // Changed to snake_case
    this.subject = answerSheet.subject;
    this.gradeLevel = answerSheet.grade_level;     // Changed to snake_case
    this.numQuestions = answerSheet.questions.length;
    this.questions = [...answerSheet.questions];
  }
  
  updateAnswerSheet() {
    if (!this.selectedAnswerSheet) {
      alert('No answer sheet selected for editing.');
      return;
    }
  
    const updatedData = {
      exam_title: this.examTitle,      // Changed to snake_case
      subject: this.subject,
      grade_level: this.gradeLevel,   // Changed to snake_case
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
      (response: any) => {
        console.log('✅ Answer sheet deleted:', response);
  
        // Check if the response is a valid JSON object with a message
        if (response && response.message) {
          alert(response.message);  // Show the response message to the user
          this.getAnswerSheets();  // Refresh the answer sheet list
        } else {
          alert('Unexpected response format from server.');
        }
      },
      error => {
        console.error('❌ Error deleting answer sheet:', error);
        // Handle non-200 responses
        if (error.status !== 200) {
          alert(`Failed to delete answer sheet: ${error.message}`);
        } else {
          alert('Failed to delete answer sheet. Unknown issue.');
        }
      }
    );
  
    this.router.navigate(['/test-processing'], {
      queryParams: {
        answerSheetId: this.selectedAnswerSheet.id
      }
    });
  }
  
  

  resetForm() {
    this.examTitle = '';
    this.subject = '';
    this.gradeLevel = '';
    this.numQuestions = 0;
    this.questions = [];
  }
}

