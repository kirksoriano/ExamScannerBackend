import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: 'teacher-dashboard.page.html',
  styleUrls: ['teacher-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TeacherDashboardPage implements OnInit {
  backButtonSub!: Subscription;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private platform: Platform,
    private authService: AuthService,
    private http: HttpClient,
  ) {}
  BASE_URL = 'https://examscannerbackend-production-7460.up.railway.app';
  tosList: any[] = [];
  userId!: number;


ngOnInit() {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/home']);
    return;
  }

  const user = this.authService.getUserData();
  this.userId = user?.id; // ✅ Set it before using it!

  console.log('User ID:', this.userId);

  this.http.get(`${this.BASE_URL}/tos/user/${this.userId}`).subscribe(
    (data: any) => {
      console.log('TOS response:', data);
      this.tosList = data.tos || data;
    },
    (error) => {
      console.error('Error fetching TOS:', error);
    }
  );
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

  goToAnswer(tosId: number) {
  this.navCtrl.navigateForward(`/answer/${tosId}`);
}


  goBack() {
    this.navCtrl.navigateBack('/teacher-dashboard');
  }

  goToTester() {
    this.navCtrl.navigateForward('/tester');
  }
}
