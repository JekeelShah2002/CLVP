import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';

import { AuthService } from '../../app/core/auth.service';
import { AppwriteService } from '../../app/core/appwrite.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private appwrite = inject(AppwriteService);

  isLoggedIn = false;
  userName = '';

  ngOnInit(): void {
    // Initial load
    this.loadUser();

    // Refresh navbar state after navigation (helps after login/signup redirect)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.loadUser());
  }

  private async loadUser() {
    try {
      this.isLoggedIn = await this.auth.isLoggedIn();
      if (!this.isLoggedIn) {
        this.userName = '';
        return;
      }

      const user = await this.appwrite.account.get();
      this.userName = (user?.name || user?.email || 'Account').trim();
    } catch {
      this.isLoggedIn = false;
      this.userName = '';
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  async logout() {
    try {
      await this.auth.logout();
      alert('✅ Logged out successfully.');
    } catch {
      alert('❌ Logout failed. Please try again.');
    }
  }
}