import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}
  public isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token');
    return token !== null;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserData(): any {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  setUserData(user: any) {
    localStorage.setItem('userData', JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('auth_token');
  }
}
