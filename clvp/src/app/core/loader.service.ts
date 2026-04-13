import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  public isLoading = signal(false);
  private showTimestamp = 0;
  private readonly MIN_LOADER_TIME_MS = 1200;
  private reqCount = 0;

  show() {
    this.reqCount++;
    if (this.reqCount === 1) {
      this.showTimestamp = Date.now();
      this.isLoading.set(true);
    }
  }

  hide() {
    this.reqCount = Math.max(0, this.reqCount - 1);
    
    if (this.reqCount === 0) {
      const timeElapsed = Date.now() - this.showTimestamp;
      const timeRemaining = this.MIN_LOADER_TIME_MS - timeElapsed;

      if (timeRemaining > 0) {
        setTimeout(() => {
          // Double check it hasn't incremented again during the timeout
          if (this.reqCount === 0) {
            this.isLoading.set(false);
          }
        }, timeRemaining);
      } else {
        this.isLoading.set(false);
      }
    }
  }
}
