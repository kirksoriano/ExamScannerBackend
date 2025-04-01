import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
}  
