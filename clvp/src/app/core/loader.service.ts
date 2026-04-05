import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  public isLoading = signal(false);
  private showTimestamp = 0;
  private readonly MIN_LOADER_TIME_MS = 1200;

  show() {
    this.showTimestamp = Date.now();
    this.isLoading.set(true);
  }

  hide() {
    const timeElapsed = Date.now() - this.showTimestamp;
    const timeRemaining = this.MIN_LOADER_TIME_MS - timeElapsed;

    if (timeRemaining > 0) {
      setTimeout(() => {
        this.isLoading.set(false);
      }, timeRemaining);
    } else {
      this.isLoading.set(false);
    }
  }
}

