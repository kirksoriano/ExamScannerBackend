import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment'; // ✅ Import environment

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://examscannerbackend-production.up.railway.app';

  constructor(private http: HttpClient) {}

  processTestPaper(imageUrl: string) {
    return this.http.post(`${this.apiUrl}/process-test-paper`, { imageUrl });
  }

  getClasses() {
    return this.http.get(`${this.apiUrl}/classes`);  // Fetch classes from backend
  }
}
