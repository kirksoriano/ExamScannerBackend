import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as Tesseract from 'tesseract.js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test-processing',
  templateUrl: './test-processing.page.html',
  styleUrls: ['./test-processing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule], 
})
export class TestProcessingPage implements OnInit {
  previewImage: string | null = null;
  extractedText: string | null = null;
  extractedData: any[] = [];
  studentName: string | null = null;
  studentScore: number = 0; // Numeric score to calculate percentage

  // Define your answer key (replace with actual answer key)
  answerKey: string[] = ['A', 'B', 'C', 'D', 'A'];

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  async openCamera() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    this.previewImage = image.dataUrl!;
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async processImage() {
    if (!this.previewImage) return;

    // OCR processing using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(this.previewImage, 'eng');
    this.extractedText = text;
    this.extractStudentData(text);
    this.extractAnswers(text); // New function to extract and score answers
  }

  extractStudentData(text: string) {
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const scoreMatch = text.match(/Score:\s*(\d+)/i);

    this.studentName = nameMatch ? nameMatch[1] : 'Not Found';
    this.studentScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0; // Fallback to 0 if not found
  }

  // Function to extract answers from the text
  extractAnswers(text: string) {
    const answerPattern = /Q(\d+):\s([A-D])/g; // Matches answers like "Q1: A"
    let match;
    const extractedAnswers: string[] = [];

    // Extract all the answers using regex
    while ((match = answerPattern.exec(text)) !== null) {
      extractedAnswers.push(match[2]);
    }

    console.log('Extracted Answers:', extractedAnswers); // Log the extracted answers
    console.log('Answer Key:', this.answerKey); // Log the answer key

    // Compare the extracted answers with the answer key
    this.calculateScore(extractedAnswers);
  }

  // Function to calculate the score based on extracted answers and the answer key
  calculateScore(extractedAnswers: string[]) {
    if (extractedAnswers.length !== this.answerKey.length) {
      console.error('Mismatch in the number of answers extracted');
      console.log('Extracted Answers Length:', extractedAnswers.length); // Log extracted answers length
      console.log('Answer Key Length:', this.answerKey.length); // Log answer key length
      return;
    }

    let score = 0;

    // Loop through the answers and compare with the correct answer
    extractedAnswers.forEach((answer, index) => {
      if (answer === this.answerKey[index]) {
        score++;
      }
    });

    this.studentScore = score; // Update the score
  }

  // Optional: Send test paper image to backend for further processing (if needed)
  processTestPaper() {
    const imageUrl = 'uploads/test.jpg';

    this.http.post('https://examscannerbackend-production.up.railway.app', { imageUrl }).subscribe(
      (response) => {
        console.log('✅ Response:', response);
      },
      (error) => {
        console.error('❌ Error:', error);
      }
    );
  }
}
