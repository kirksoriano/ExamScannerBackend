import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BubbleTemplate, bubbles } from '../data/bubble-template';

@Component({
  selector: 'app-tester',
  templateUrl: './tester.page.html',
  styleUrls: ['./tester.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TesterPage implements AfterViewInit {
  @ViewChild('overlayCanvas', { static: false }) overlayCanvas!: ElementRef<HTMLCanvasElement>;

  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';
  teacherId = 123; // Replace with dynamic teacher ID from auth
  answerSheets: any[] = [];
  selectedSheetId: number | null = null;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.loadAnswerSheets();
  }

  loadAnswerSheets() {
    this.http.get<any[]>(`${this.BASE_URL}/answer-sheets?teacher_id=${this.teacherId}`)
      .subscribe({
        next: (sheets) => {
          this.answerSheets = sheets;
        },
        error: (err) => {
          console.error('❌ Failed to load answer sheets:', err);
        }
      });
  }

  onSheetSelect(sheetId: number | null) {
    if (!sheetId || isNaN(sheetId)) {
      console.error('❌ Invalid sheet ID:', sheetId);
      return;
    }

    this.selectedSheetId = sheetId;
    console.log('✅ Selected Sheet ID:', sheetId);

    this.http.get<{ sheetId: number, answers: { [key: number]: 'A' | 'B' | 'C' | 'D' } }>(
      `${this.BASE_URL}/answer-sheets/${sheetId}/answers`
    ).subscribe({
      next: (response) => {
        this.drawOverlay(response.answers);
      },
      error: (err) => {
        console.error('❌ Failed to load answers:', err);
      }
    });
  }

  drawOverlay(answerKey: { [key: number]: 'A' | 'B' | 'C' | 'D' }) {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';

    bubbles.forEach(bubble => {
      const correctOption = answerKey[bubble.question];

      Object.entries(bubble.options).forEach(([option, coord]) => {
        const { cx, cy, radius } = coord;

        // Highlight correct answer
        if (option === correctOption) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Outline
        ctx.strokeStyle = 'gray';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Label option letter
        ctx.fillStyle = 'black';
        ctx.fillText(option, cx - 5, cy + 5);
      });
    });
  }
}
