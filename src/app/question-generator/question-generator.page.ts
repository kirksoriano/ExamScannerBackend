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
      this.errorMessage = 'Please enter some text.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.questions = [];

    this.http.post<any>('https://examscannerbackend-production-7460.up.railway.app/generate-question', {
      text: this.inputText,
    }).subscribe({
      next: (response) => {
        // Assume HuggingFace response is an array of questions
        this.questions = response.result;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to generate questions.';
        this.loading = false;
      }
    });
  }
}
