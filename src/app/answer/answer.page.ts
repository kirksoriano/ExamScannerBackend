import { Component, ElementRef } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.services';
import { saveAs } from 'file-saver'; // install with npm install file-saver

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})

export class AnswerPage {
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';
  layoutZones: any[] = [];
  tosId = 1; // Replace with actual selected TOS ID
  examTitle = '';
  subject = '';
  gradeLevel = '';
  numQuestions = 0;
  questions: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D'];

  answerSheets: any[] = [];
  selectedAnswerSheet: any = null;

  teacherId: any;

  constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router,
    private apiService: ApiService,
  ) {}
  previewLayout() {
    this.http.get<any[]>(`http://localhost:5001/answer-sheet-layout/${this.tosId}`).subscribe(
      (data) => {
        this.layoutZones = data;
      },
      (err) => {
        console.error('Error loading layout', err);
      }
    );
  }

  downloadPDF() {
    this.http.get(`http://localhost:5001/answer-sheet-printable/${this.tosId}`, {
      responseType: 'blob'
    }).subscribe(
      (blob) => {
        saveAs(blob, 'answer-sheet.pdf');
      },
      (err) => {
        console.error('PDF generation failed', err);
      }
    );
  }

  generateLayout() {
  const url = 'https://examscannerbackend-production-7460.up.railway.app/answerSheets/generate-layout';

  const body = {
    subject: 'Math', // or use variables from a form/input
    numberOfQuestions: 20,
    optionsPerQuestion: 5
  };

  this.http.post(url, body).subscribe({
    next: (response) => {
      console.log('Generated layout:', response);
      // Store or use the response however you need
    },
    error: (error) => {
      console.error('Error generating layout:', error);
    }
  });
}

}