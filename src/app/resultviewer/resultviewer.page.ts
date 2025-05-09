import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { Router } from '@angular/router';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ResultviewerPage{
  image: string = '';
  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    this.image = state?.image
  }
}
