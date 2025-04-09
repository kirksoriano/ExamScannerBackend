import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'https://examscannerbackend-production.up.railway.app'; // Your API base URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Example: Get classes with authentication
  getClasses(teacherId: number): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.get<any>(`${this.baseUrl}/classes/${teacherId}`, { headers: headers });
  }

  // Example: Register a student (with authentication)
  registerStudent(studentData: any): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.post<any>(`${this.baseUrl}/students`, studentData, { headers: headers });
  }

  // Example: Update user profile
  updateProfile(userId: number, updatedData: any): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.put<any>(`${this.baseUrl}/users/${userId}`, updatedData, { headers: headers });
  }

  // Corrected processTestPaper method with baseUrl
  processTestPaper(imageUrl: string) {
    return this.http.post(`${this.baseUrl}/process-test-paper`, { imageUrl });
  }
}
