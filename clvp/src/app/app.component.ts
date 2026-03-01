import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { ToastComponent } from '../shared/toast/toast.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { LoaderService } from './core/loader.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent, FooterComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'clvp';
  private router = inject(Router);
  public loaderService = inject(LoaderService);

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.loaderService.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // slight delay to let rendering finish smoothly
        setTimeout(() => {
          this.loaderService.hide();
        }, 500);
      }
    });
  }
}
