import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OpenCvService {
  isReady = false;

  loadOpenCv(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).cv && (window as any).cv.imread) {
        this.isReady = true;
        resolve();
      } else {
        // Wait for OpenCV to finish loading
        (window as any).onOpenCvReady = () => {
          this.isReady = true;
          resolve();
        };

        // Timeout in case of failure
        setTimeout(() => reject("OpenCV did not load in time"), 10000);
      }
    });
  }
}
