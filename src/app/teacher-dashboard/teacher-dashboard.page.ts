import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Import IonicModule
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: 'teacher-dashboard.page.html',
  styleUrls: ['teacher-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule] // Ensure this is here
})

export class TeacherDashboardPage {
  backButtonSub!: Subscription;

  constructor(private router: Router, private navCtrl: NavController, private platform: Platform) {}

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      // Do nothing — this blocks the default back navigation
    });
  }

  ionViewWillLeave() {
    this.backButtonSub.unsubscribe(); // Clean up when leaving the page
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

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