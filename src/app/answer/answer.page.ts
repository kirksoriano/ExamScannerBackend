// answer.page.ts
import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AnswerPage implements OnInit {
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  tosList: any[] = [];
  classList: any[] = [];

  tosId: number = 0;
  classId: number = 0;
  title: string = 'Exam Title';

  className: string = '';
  subjectName: string = '';

  layoutZones: any[] = [];

  cognitiveLevelCounts: { [key: string]: number } = {};
  topicCounts: { [key: string]: number } = {};

  constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadTOSList();
    this.loadClassList();
  }

  loadTOSList() {
    const userId = this.authService.getCurrentUserId();
    this.http.get<any>(`${this.BASE_URL}/tos/user/${userId}`).subscribe({
      next: (response) => {
        this.tosList = response;
      },
      error: (err) => {
        console.error('❌ Failed to load TOS list:', err);
      }
    });
  }

  loadClassList() {
    const userId = this.authService.getCurrentUserId();
    const params = new HttpParams().set('teacher_id', userId.toString());
    this.http.get<any>(`${this.BASE_URL}/classes`, { params }).subscribe({
      next: (response) => {
        this.classList = response;
      },
      error: (err) => {
        console.error('❌ Failed to load class list:', err);
      }
    });
  }

  generateLayout() {
    if (!this.tosId || !this.classId || !this.title.trim()) {
      alert('Please select TOS, class, and enter a title.');
      return;
    }

    const payload = {
      tosId: this.tosId,
      classId: this.classId,
      title: this.title.trim()
    };

    this.http.post<any>(`${this.BASE_URL}/answerSheets/generate-layout`, payload).subscribe({
      next: (response) => {
        const base64 = response.pdfBase64;
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'answer-sheet.pdf';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('❌ Failed to generate layout:', err);
        alert('Layout generation failed.');
      }
    });
  }

  previewLayout() {
    if (!this.tosId) {
      alert('Please select a TOS first.');
      return;
    }

    this.http.get<any[]>(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`).subscribe({
      next: (zones) => {
        this.layoutZones = zones;

        this.cognitiveLevelCounts = {};
        this.topicCounts = {};

        for (const zone of zones) {
          const level = zone.cognitiveLevel || 'Unknown';
          const topic = zone.topic || 'Unknown';

          this.cognitiveLevelCounts[level] = (this.cognitiveLevelCounts[level] || 0) + 1;
          this.topicCounts[topic] = (this.topicCounts[topic] || 0) + 1;
        }
      },
      error: (err) => {
        console.error('❌ Failed to preview layout:', err);
      }
    });
  }

  downloadPDF() {
    if (!this.tosId) {
      alert('Please select a TOS first.');
      return;
    }

    this.http.get(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        saveAs(blob, `answer-sheet-${this.tosId}.pdf`);
      },
      error: (err) => {
        console.error('❌ Failed to download PDF:', err);
      }
    });
  }
}
