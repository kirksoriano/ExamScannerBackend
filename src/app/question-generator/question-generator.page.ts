import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

Component({
  selector: 'app-question-generator',
  templateUrl: './question-generator.page.html',
  styleUrls: ['./question-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})

//const readline = require('readline');
export class QuestionGeneratorPage {
}