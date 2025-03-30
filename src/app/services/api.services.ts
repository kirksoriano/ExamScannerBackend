
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';  // Import environment

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;  // Use the environment variable

  constructor(private http: HttpClient) {}

  getClasses() {
    return this.http.get(`${this.apiUrl}/classes`);  // Fetch classes from backend
  }
}
