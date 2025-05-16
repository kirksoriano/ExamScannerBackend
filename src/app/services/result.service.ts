import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private data: {
    image: string | null;
    results: any[];
    classPercentage: number;
    studentPercentage: number;
  } | null = null;

  setResult(data: { image: string | null; results: any[]; classPercentage: number; studentPercentage: number }) {
    this.data = data;
  }

  getResult() {
    return this.data;
  }

  clearResult() {
    this.data = null;
  }
}
