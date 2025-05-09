import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-question-generator',
  templateUrl: './question-generator.page.html',
  styleUrls: ['./question-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class QuestionGeneratorPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }
  selectedQuestionType: string = 'mcq'; // Default to MCQ
  numOfQuestions: number = 5; // Default to 5 questions
  generatedQuestions: any[] = [];

  mcqTemplates = [
    { question: "What is the capital of [Country]?", options: ["A", "B", "C", "D"] },
    { question: "Which country is [City] located in?", options: ["A", "B", "C", "D"] }
  ];

  trueFalseTemplates = [
    { question: "Is [Country] located in Asia?", options: ["True", "False"] },
    { question: "Is [City] the capital of [Country]?", options: ["True", "False"] }
  ];

  countries = [
    { name: "USA", capital: "Washington, D.C." },
    { name: "India", capital: "New Delhi" },
    { name: "Japan", capital: "Tokyo" }
  ];

  generateQuestions() {
    const selectedTemplate =
      this.selectedQuestionType === 'mcq' ? this.mcqTemplates : this.trueFalseTemplates;

    this.generatedQuestions = [];
    for (let i = 0; i < this.numOfQuestions; i++) {
      const randomTemplate = selectedTemplate[Math.floor(Math.random() * selectedTemplate.length)];
      const randomCountry = this.countries[Math.floor(Math.random() * this.countries.length)];

      let question = randomTemplate.question;
      question = question.replace("[Country]", randomCountry.name);
      if (randomTemplate.question.includes("[City]")) {
        question = question.replace("[City]", randomCountry.capital);
      }

      this.generatedQuestions.push({
        question,
        options: randomTemplate.options
      });
    }

    console.log(this.generatedQuestions); // You can display the questions to the user here
  }
}

