import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.services';
import { saveAs } from 'file-saver';

interface TosRow {
  topic: string;
  cognitiveLevel: string;
  numberOfItems: number;
}

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnswerPage implements OnInit {
  @Input() tosRows: TosRow[] = [];
  @Input() className: string = '';
  @Input() subjectName: string = '';
  @Input() title: string = 'Exam Title';

  tosId: number = 1;
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  totalQuestions: number = 0;
  layoutZones: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D'];
  answerSheets: any[] = [];
  selectedAnswerSheet: any = null;
  classId: string = '';  // 👈 This line is required to fix the error

  cognitiveLevelCounts: { [key: string]: number } = {};
  topicCounts: { [key: string]: number } = {};

  constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.tosId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTOSDetails();
    this.loadTOSItems();
  }

  loadTOSDetails() {
    this.http.get(`${this.BASE_URL}/tos/${this.tosId}`).subscribe((tos: any) => {
      this.title = tos.title || 'Exam Title';
      this.subjectName = tos.subject || '';
      this.className = tos.className || '';
    });
  }

  loadTOSItems() {
    this.http.get<any>(`${this.BASE_URL}/tos/${this.tosId}/items`).subscribe((response) => {
      const items = response.items || [];

      const cognitiveLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];

      this.tosRows = items.map((item: any) => {
        const maxLevel = cognitiveLevels.reduce((prev, curr) =>
          item[curr] > item[prev] ? curr : prev, 'remembering'
        );

        return {
          topic: item.topic || 'Unknown',
          cognitiveLevel: maxLevel,
          numberOfItems: item.total_no_of_items || item.no_of_items || 0
        };
      });

      this.totalQuestions = this.tosRows.reduce((sum, row) => sum + row.numberOfItems, 0);

      this.cognitiveLevelCounts = this.tosRows.reduce((acc: any, row) => {
        acc[row.cognitiveLevel] = (acc[row.cognitiveLevel] || 0) + row.numberOfItems;
        return acc;
      }, {});

      this.topicCounts = this.tosRows.reduce((acc: any, row) => {
        acc[row.topic] = (acc[row.topic] || 0) + row.numberOfItems;
        return acc;
      }, {});

      // Optional: auto-generate layout after loading TOS
      // this.generateLayout();
    });
  }

  generateLayout() {
    const payload = {
      tosId: this.tosId,
      classId: this.classId,
      title: this.title,
      tosRows: this.tosRows
    };
  
    if (!payload.tosId || !payload.title || this.tosRows.length === 0) {
      console.error('❌ Missing required data to generate layout.', payload);
      return;
    }
  
    this.http.post<any>(`${this.BASE_URL}/answerSheets/generate-layout`, payload).subscribe(
      response => {
        const base64 = response.pdfBase64;
  
        // Create a Blob and download
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
  
        // Open or download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'answer-sheet.pdf';
        link.click();
  
        URL.revokeObjectURL(url); // cleanup
      },
      error => {
        console.error('❌ Layout Generation Error:', error);
      }
    );
  }  

  uploadHeaderImage(file: File, studentId: number, answerSheetsId: number) {
    if (!file || !studentId || !answerSheetsId) {
      console.error('❌ Missing file or required IDs for header upload.');
      return;
    }
  
    const formData = new FormData();
    formData.append('header', file); // 'header' must match backend field name
    formData.append('studentId', studentId.toString());
    formData.append('answerSheetsId', answerSheetsId.toString());
  
    this.http.post(`${this.BASE_URL}/upload-header`, formData).subscribe({
      next: (res: any) => {
        console.log('✅ Header image uploaded successfully:', res);
        alert('Header image uploaded!');
      },
      error: (err) => {
        console.error('❌ Failed to upload header image:', err);
        alert('Header image upload failed.');
      }
    });
  }
  

  previewLayout() {
    if (!this.tosId) {
      console.error('❌ Missing tosId.');
      return;
    }

    this.http.get<any[]>(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`).subscribe({
      next: (data) => {
        console.log('✅ Preview layout loaded:', data);
        this.layoutZones = data;
      },
      error: (err) => {
        console.error('❌ Error loading layout preview:', err);
      }
    });
  }

  downloadPDF() {
    if (!this.tosId) {
      console.error('❌ Missing tosId.');
      return;
    }

    this.http.get(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        saveAs(blob, `answer-sheet-${this.tosId}.pdf`);
      },
      error: (err) => {
        console.error('❌ PDF generation failed:', err);
      }
    });
  }
}
