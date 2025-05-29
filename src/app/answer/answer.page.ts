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

  tosId: number = 0;
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  totalQuestions: number = 0;
  layoutZones: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D'];
  answerSheets: any[] = [];
  selectedAnswerSheet: any = null;

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
    const idParam = this.route.snapshot.paramMap.get('id');
    this.tosId = idParam ? Number(idParam) : 0;

    console.log('📌 Loaded tosId:', this.tosId);
    if (!this.tosId) {
      console.error('❌ Invalid or missing TOS ID in route.');
      return;
    }

    this.loadTOSDetails();
    this.loadTOSItems();
  }

  loadTOSDetails() {
    this.http.get(`${this.BASE_URL}/tos/${this.tosId}`).subscribe({
      next: (tos: any) => {
        this.title = tos.title || 'Exam Title';
        this.subjectName = tos.subject || '';
        this.className = tos.className || '';

        console.log('📘 TOS Details:', { title: this.title, subject: this.subjectName, class: this.className });
      },
      error: (err) => {
        console.error('❌ Failed to load TOS details:', err);
      }
    });
  }

  loadTOSItems() {
    this.http.get<any>(`${this.BASE_URL}/tos/${this.tosId}/items`).subscribe({
      next: (response) => {
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

        console.log('📄 Loaded TOS Items:', this.tosRows);
      },
      error: (err) => {
        console.error('❌ Failed to load TOS items:', err);
      }
    });
  }

  generateLayout() {
    if (!this.tosId || !this.title || this.tosRows.length === 0) {
      console.error('❌ Missing required data to generate layout.', {
        tosId: this.tosId,
        title: this.title,
        tosRowsLength: this.tosRows.length
      });
      return;
    }

    const body = {
      tosId: this.tosId,
      classId: 1, // Optional: replace with dynamic classId if available
      title: this.title,
      tosRows: this.tosRows
    };

    console.log('📦 Sending layout request body:', body);

    this.http.post(`${this.BASE_URL}/answerSheets/generate-layout`, body).subscribe({
      next: (response: any) => {
        console.log('✅ Layout generated:', response);
        this.layoutZones = response.layout || [];
      },
      error: (error) => {
        console.error('❌ Error generating layout:', error);
        if (error.status === 400) {
          alert('Bad Request: Please ensure all required fields are filled.');
        }
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
        console.log('📄 PDF downloaded.');
      },
      error: (err) => {
        console.error('❌ PDF generation failed:', err);
      }
    });
  }
}
