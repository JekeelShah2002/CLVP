import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../app/core/auth.service';
import { NotificationService } from '../../app/core/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  public auth = inject(AuthService);
  private ns = inject(NotificationService);

  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  userName = computed(() => {
    const user = this.auth.currentUser();
    return user ? (user.name || user.email || 'Account').trim() : '';
  });

  ngOnInit(): void {
    // Initial fetch to load user context
    this.auth.isLoggedIn();
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  async logout() {
    try {
      await this.auth.logout();
      this.ns.success('Logged out successfully.');
    } catch {
      this.ns.error('Logout failed. Please try again.');
    }
  }
}
