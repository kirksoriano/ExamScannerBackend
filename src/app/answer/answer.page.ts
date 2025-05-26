import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
// ...imports and decorator unchanged

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

    if (!this.examTitle || !this.subject || !this.gradeLevel || this.numQuestions <= 0) {
      alert('Please fill out all form fields and add questions.');
      return;
    }

    const hasUnanswered = this.questions.some(q => !q.answer);
    if (hasUnanswered) {
      const confirmSave = confirm('Some questions have no selected answer. Do you still want to save?');
      if (!confirmSave) return;
    }

    const payload = {
      examTitle: this.examTitle,
      subject: this.subject,
      gradeLevel: this.gradeLevel,
      questions: this.questions,
      teacherId: this.teacherId
    };

    this.http.post(`${this.BASE_URL}/answer-sheets`, payload).subscribe(
      () => {
        alert('Answer sheet saved successfully!');
        this.getAnswerSheets();
        this.resetForm();
      },
      error => {
        console.error('❌ Error saving answer sheet:', error);
        alert('Failed to save answer sheet.');
      }
    );
  }

  getAnswerSheets() {
    if (!this.teacherId) return;

    this.http.get(`${this.BASE_URL}/answer-sheets?teacher_id=${this.teacherId}`).subscribe(
      (response: any) => {
        this.answerSheets = response;
      },
      error => {
        console.error('❌ Error fetching answer sheets:', error);
        alert('Failed to fetch answer sheets.');
      }
    );
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

    const payload = {
      examTitle: this.examTitle,
      subject: this.subject,
      gradeLevel: this.gradeLevel,
      questions: this.questions
    };

    this.http.put(`${this.BASE_URL}/answer-sheets/${this.selectedAnswerSheet.id}`, payload).subscribe(
      () => {
        alert('Answer sheet updated successfully!');
        this.getAnswerSheets();
        this.resetForm();
        this.selectedAnswerSheet = null;
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
        alert(response?.message || 'Answer sheet deleted.');
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
    this.selectedAnswerSheet = null;
  }
}
