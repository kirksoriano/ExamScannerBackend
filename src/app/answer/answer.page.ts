import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.services';
import { saveAs } from 'file-saver'; // install with npm install file-saver
import { ActivatedRoute } from '@angular/router';


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

    tosId: number = 1; // or dynamically set this later

  totalQuestions: number = 0;
  questionPositions: { questionNumber: number, column: number, row: number }[] = [];

  columnsLayout: number = 0;
constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
  this.tosId = Number(this.route.snapshot.paramMap.get('id'));

  this.http.get(`${this.BASE_URL}/tos/${this.tosId}`).subscribe((tos: any) => {
    this.title = tos.title;
    this.subjectName = tos.subject;
    this.className = tos.className;
  });

    this.http.get<any>(`${this.BASE_URL}/tos/${this.tosId}/items`).subscribe((response) => {
    const items = response.items || []; // extract actual array
    this.tosRows = items;
    this.totalQuestions = items.reduce((sum: number, row: TosRow) => sum + row.numberOfItems, 0);
    this.generateLayout();
  });

}


  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';
  layoutZones: any[] = [];
  answerOptions = ['A', 'B', 'C', 'D'];
  answerSheets: any[] = [];
  selectedAnswerSheet: any = null;

  teacherId: any;


  previewLayout() {
    this.http.get<any[]>(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`
).subscribe(
      (data) => {
        this.layoutZones = data;
      },
      (err) => {
        console.error('Error loading layout', err);
      }
    );
  }

  downloadPDF() {
    this.http.get(`${this.BASE_URL}/answer-sheet-printable/${this.tosId}`
, {
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
  const url = `${this.BASE_URL}/generate-answer-sheet`;

  const body = {
    tosId: this.tosId,
    title: this.title,
    classId: 1 // Replace this with real classId if you later fetch it
  };

  console.log('📦 Sending layout request body:', body);

  this.http.post(url, body).subscribe({
    next: (response: any) => {
      console.log('✅ Generated layout:', response);
      this.layoutZones = response.layoutZones || [];
    },
    error: (error) => {
      console.error('❌ Error generating layout:', error);
    }
  });
}
}