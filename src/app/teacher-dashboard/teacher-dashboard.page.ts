import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: 'teacher-dashboard.page.html',
  styleUrls: ['teacher-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class TeacherDashboardPage implements OnInit {
  backButtonSub!: Subscription;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private platform: Platform,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      // Do nothing — disable hardware back to prevent login page return
    });
  }

  ionViewWillLeave() {
    this.backButtonSub.unsubscribe();
  }

  logout() {
    this.authService.logout();
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
    this.navCtrl.navigateBack('/teacher-dashboard');
  }
}
