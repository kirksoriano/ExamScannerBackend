import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ResultviewerPage implements OnInit {
  Object = Object;

  // Your properties for studentAnswers etc
  studentAnswers: any = {};
  answerKey: any = {};
  image: string | null = null;
  results: any[] = [];
  meanPercentage: number = 0;

  classPercentage: number = 0;
  studentPercentage: number = 0;

  chart: Chart | undefined;

  constructor(private route: ActivatedRoute, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.studentAnswers = nav.extras.state['answers'] || {};
      this.answerKey = nav.extras.state['answerKey'] || {};
    }
  
  }
  total: number = 0; // <== Add this
  sortedQuestions: string[] = [];
  score: number = 0;
  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.studentAnswers = nav.extras.state['answers'];
      this.answerKey = nav.extras.state['answerKey'];
      this.score = nav.extras.state['score'];
      this.total = nav.extras.state['total'];
    }
      // Generate sorted question numbers
      this.sortedQuestions = Object.keys(this.studentAnswers).sort((a, b) => +a - +b);
    const state = history.state;
    this.image = state.image;
    this.results = state.results || [];
    this.classPercentage = state.classPercentage || 0;
    this.studentPercentage = state.studentPercentage || 0;
    

    this.calculateStudentAnswers();
    this.calculateMeanPercentage();
    this.renderChart();
  }

  calculateStudentAnswers() {
    this.studentAnswers = {};

    this.results.forEach(result => {
      const questionNumber = result.question;
      if (!this.studentAnswers[questionNumber]) {
        this.studentAnswers[questionNumber] = { A: 0, B: 0, C: 0, D: 0 };
      }

      // Count selected answers
      result.answers.forEach((answer: string) => {
        if (this.studentAnswers[questionNumber][answer] !== undefined) {
          this.studentAnswers[questionNumber][answer]++;
        }
      });
    });
  }

  calculateMeanPercentage() {
    const totalQuestions = this.results.length;
    if (totalQuestions === 0) {
      this.meanPercentage = 0;
      return;
    }

    const totalScore = this.results.reduce((acc, result) => acc + (result.correct ? 1 : 0), 0);
    this.meanPercentage = (totalScore / totalQuestions) * 100;
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('answersChart') as HTMLCanvasElement;
    const questions = Object.keys(this.studentAnswers).sort((a, b) => +a - +b);
    const answerOptions = ['A', 'B', 'C', 'D'];
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b'];

    const datasets = answerOptions.map((option, idx) => ({
      label: `Option ${option}`,
      data: questions.map(q => this.studentAnswers[+q][option] || 0),
      backgroundColor: colors[idx],
    }));

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: questions.map(q => `Q${q}`),
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Answer Distribution per Question',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Number of Students',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Questions',
            },
          },
        },
      },
    });
  }
}
