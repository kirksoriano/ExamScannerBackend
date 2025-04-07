import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Import IonicModule
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: 'teacher-dashboard.page.html',
  styleUrls: ['teacher-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule] // Ensure this is here
})
export class TeacherDashboardPage {
  constructor(private navCtrl: NavController) {}

  goToStudents() {
    this.navCtrl.navigateForward('/students');
  }

  goToTOS() {
    this.navCtrl.navigateForward('/tos');
  }

  goToProfile() {
    this.navCtrl.navigateForward('/profile');
  }

  goToTestProcessing() {
    this.navCtrl.navigateForward('/test-processing');
  }

  goToAnswer() {
    this.navCtrl.navigateForward('/answer');
  }
  goBack() {
    // Navigate back to the teacher-dashboard page
    this.navCtrl.navigateBack('/teacher-dashboard');
  }
}