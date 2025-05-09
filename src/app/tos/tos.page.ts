import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
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

  constructor(private router: Router) {}

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
    });
  }

  deleteRow(index: number) {
    this.tableData.splice(index, 1);
  }

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

  generateQuestions() {
    this.router.navigate(['/question-generator'], {
      state: { tosData: this.tableData, subjectTitle: this.subjectTitle },
    });
  }

  printTOS() {
    const subjectTitle = this.subjectTitle
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
        </tr>
      `)
      .join('');

    const htmlContent = `
      <html>
        <head>
          <title>Print TOS</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f0f0f0;
            }
          </style>
        </head>
        <body>
          ${subjectTitle}
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
}
