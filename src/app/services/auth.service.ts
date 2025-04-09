import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userId: string | null = localStorage.getItem('userId'); // Simulated local storage

  constructor() {}

  // ✅ Renamed to avoid conflict with the method
  public isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token');
    return token !== null;
  }

  // Get the stored JWT token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserId() {
    return this.userId;
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  logout() {
    this.userId = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('auth_token'); // Optional: remove token on logout
  }
}
