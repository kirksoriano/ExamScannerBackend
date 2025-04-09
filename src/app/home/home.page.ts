import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class HomePage implements OnInit {
  loginEmail = '';
  loginPassword = '';
  registerEmail = '';
  registerPassword = '';
  registerName = '';
  isRegistering = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authservice: AuthService,
  ) {}

  ngOnInit() {
    // Check if the user is already logged in when the page loads
    if (this.authservice.isLoggedIn()) {
      this.router.navigate(['/teacher-dashboard']);
    }
  }

  async login() {
    const loading = await this.loadingCtrl.create({
      message: 'Logging in...',
    });
    await loading.present();

    this.http.post<any>('https://examscannerbackend-production.up.railway.app/login', {
      email: this.loginEmail,
      password: this.loginPassword,
    }).subscribe(
      async (res) => {
        await loading.dismiss();
        // Save the JWT token in localStorage
        localStorage.setItem('token', res.token);  // Store JWT token
        this.authservice.setUserId(res.user.id);  // Store user ID in AuthService
        this.router.navigate(['/teacher-dashboard']);
      },
      async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Login Failed',
          message: err.error.message || 'Invalid email or password.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    );
  }

  async register() {
    const loading = await this.loadingCtrl.create({
      message: 'Registering...',
    });
    await loading.present();

    this.http.post<any>('https://examscannerbackend-production.up.railway.app/register', {
      name: this.registerName,
      email: this.registerEmail,
      password: this.registerPassword,
    }).subscribe(
      async (res) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Success',
          message: 'Registration successful. You can now log in.',
          buttons: ['OK'],
        });
        await alert.present();
        this.isRegistering = false;
      },
      async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Registration Failed',
          message: err.error.message || 'Could not register.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    );
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
  }
}
