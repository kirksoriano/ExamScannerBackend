import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tos',
  templateUrl: './tos.page.html',
  styleUrls: ['./tos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
