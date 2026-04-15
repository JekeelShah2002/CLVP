import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterModule, AnimatedBgComponent],
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent {
  private router = inject(Router);

  goHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    window.history.back();
  }
}
