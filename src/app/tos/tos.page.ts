import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tos',
  templateUrl: './tos.page.html',
  styleUrls: ['./tos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class TosPage {
  tableData: any[] = [];
  subjectTitle: string = '';
  teacherId: any;
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';

  constructor(
    private router: Router,
    private http: HttpClient,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      this.navCtrl.navigateRoot('/home');
      return;
    }
    const user = JSON.parse(userData);
    this.teacherId = user.id;
    console.log('✅ Teacher ID loaded:', this.teacherId);
  }

  // Add a new row to the TOS table
  addRow() {
    this.tableData.push({
      learningCompetencies: '',
      noOfDays: null,
      percentage: null,
      noOfItems: null,
      remembering: 0,
      understanding: 0,
      applying: 0,
      analyzing: 0,
      evaluating: 0,
      creating: 0,
      totalNoOfItems: 0,
      questionsToGenerate: 1, // Default to 1
    });
  }

  // Remove a row from the TOS table
  deleteRow(index: number) {
    this.tableData.splice(index, 1);
  }

  // Update the total number of items for a row
  updateTotal(index: number) {
    const row = this.tableData[index];
    row.totalNoOfItems =
      (row.remembering || 0) +
      (row.understanding || 0) +
      (row.applying || 0) +
      (row.analyzing || 0) +
      (row.evaluating || 0) +
      (row.creating || 0);
  }

  // Save the entire TOS to backend
  saveTOS() {
    if (!this.teacherId) {
      alert('Teacher not logged in.');
      return;
    }

    const mainTosData = {
      teacherId: this.teacherId,
      tosTitle: this.subjectTitle,
      subject: this.subjectTitle,
      totalItems: this.tableData.reduce((sum, row) => sum + (row.totalNoOfItems || 0), 0),
    };

    this.http.post(`${this.BASE_URL}/tos`, mainTosData).subscribe(
      (response: any) => {
        const tosId = response.insertId || response.id;

        const tosItemsRequests = this.tableData.map((row) => {
          return this.http.post(`${this.BASE_URL}/tos/${tosId}/items`, {
            topic: row.learningCompetencies,
            items: row.totalNoOfItems || 0,
            learningCompetency: row.learningCompetencies,
            noOfDays: row.noOfDays,
            percentage: row.percentage,
            noOfItems: row.noOfItems,
            remembering: row.remembering,
            understanding: row.understanding,
            applying: row.applying,
            analyzing: row.analyzing,
            evaluating: row.evaluating,
            creating: row.creating,
            totalNoOfItems: row.totalNoOfItems,
            questionsToGenerate: row.questionsToGenerate || 1,
          });
        });

        Promise.all(tosItemsRequests.map(req => req.toPromise())).then(() => {
          alert('✅ Table of Specification and items saved successfully!');
        }).catch((err) => {
          console.error('❌ Error saving TOS items:', err);
          alert('Some items may have failed to save.');
        });

      },
      (error) => {
        console.error('❌ Error saving main TOS:', error);
        alert('Failed to save Table of Specification.');
      }
    );
  }

  // Navigate to question generator
  generateQuestions() {
    this.router.navigate(['/question-generator'], {
      state: { tosData: this.tableData, subjectTitle: this.subjectTitle },
    });
  }

  // Print the current TOS table
  printTOS() {
    const subjectTitleHTML = this.subjectTitle
      ? `<h1 style="text-align: center;">${this.subjectTitle}</h1>`
      : '';

    const tableHtml = this.tableData
      .map((row) => `
        <tr>
          <td>${row.learningCompetencies}</td>
          <td>${row.noOfDays ?? ''}</td>
          <td>${row.percentage ?? ''}</td>
          <td>${row.noOfItems ?? ''}</td>
          <td>${row.remembering ?? 0}</td>
          <td>${row.understanding ?? 0}</td>
          <td>${row.applying ?? 0}</td>
          <td>${row.analyzing ?? 0}</td>
          <td>${row.evaluating ?? 0}</td>
          <td>${row.creating ?? 0}</td>
          <td>${row.totalNoOfItems ?? 0}</td>
          <td>${row.questionsToGenerate ?? 1}</td>
        </tr>
      `)
      .join('');

    const htmlContent = `
      <html>
        <head>
          <title>Print TOS</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          ${subjectTitleHTML}
          <table>
            <thead>
              <tr>
                <th>Learning Competencies</th>
                <th>No. of Days</th>
                <th>%</th>
                <th>No. of Items</th>
                <th>Remembering</th>
                <th>Understanding</th>
                <th>Applying</th>
                <th>Analyzing</th>
                <th>Evaluating</th>
                <th>Creating</th>
                <th>Total No. of Items</th>
                <th># of Questions</th>
              </tr>
            </thead>
            <tbody>
              ${tableHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  // Go back to previous page
  goBack() {
    window.history.back();
  }
}
