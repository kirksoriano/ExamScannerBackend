import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  processTestPaper(imageUrl: string) {
    return this.http.post(`${this.apiUrl}/process-test-paper`, { imageUrl });
  }
}
