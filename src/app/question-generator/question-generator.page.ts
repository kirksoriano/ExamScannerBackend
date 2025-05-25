import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-generator',
  templateUrl: './question-generator.page.html',
  styleUrls: ['./question-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class QuestionGeneratorPage {
  inputText = '';
  questions: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  generateQuestions() {
  if (!this.inputText.trim()) {
    this.errorMessage = 'Please enter a competency to generate questions from.';
    return;
  }

  this.loading = true;
  this.errorMessage = '';
  this.questions = [];

  this.http.post<any>('https://examscannerbackend-production-7460.up.railway.app/generate-question', {
    competencyText: this.inputText, // ✅ FIXED: changed from "text" to "competencyText"
    questionCount: 3                // ✅ Optional: can be dynamic or fixed
  }).subscribe({
    next: (response) => {
      this.questions = response.questions || response.result || []; // Just in case
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.errorMessage = err?.error?.error || 'Failed to generate questions.';
      this.loading = false;
    }
  });
}

}
