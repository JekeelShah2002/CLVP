import { Component, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

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
  private eRef = inject(ElementRef);

  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  userName = computed(() => {
    const user = this.auth.currentUser();
    return user ? (user.name || user.email || 'Account').trim() : '';
  });

  // Track current URL to toggle between Login/Signup buttons
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isLoginPage = computed(() => this.currentUrl()?.includes('/login'));

  isDropdownOpen = false;

  ngOnInit(): void {
    // Initial fetch to load user context
    this.auth.isLoggedIn();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      return;
    }
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  goToSignup() {
    this.router.navigateByUrl('/register');
  }

  async logout() {
    try {
      this.isDropdownOpen = false;
      await this.auth.logout();
      this.ns.success('Logged out successfully.');
    } catch {
      this.ns.error('Logout failed. Please try again.');
    }
  }
}

