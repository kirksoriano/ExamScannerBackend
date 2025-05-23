import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://examscannerbackend-production-7460.up.railway.app'; // Your API base URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get classes with authentication
  getClasses(teacherId: number): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.get<any>(`${this.baseUrl}/classes/${teacherId}`, { headers: headers });
  }

  // Register a student (with authentication)
  registerStudent(studentData: any): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.post<any>(`${this.baseUrl}/students`, studentData, { headers: headers });
  }

  // Update user profile (with authentication)
  updateProfile(userId: number, updatedData: any): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    return this.http.put<any>(`${this.baseUrl}/users/${userId}`, updatedData, { headers: headers });
  }

  // Process test paper (with authentication)
  processTestPaper(imageUrl: string | Blob): Observable<any> {
    const token = this.authService.getToken(); // Get token from AuthService
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Add Authorization header

    // If imageUrl is a file, convert it to FormData
    const formData = new FormData();
    formData.append('image', imageUrl);

    return this.http.post<any>(`${this.baseUrl}/process-test-paper`, formData, { headers: headers });
  }
}
