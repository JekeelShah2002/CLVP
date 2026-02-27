import { Component, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
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
  private eRef = inject(ElementRef);

  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  userName = computed(() => {
    const user = this.auth.currentUser();
    return user ? (user.name || user.email || 'Account').trim() : '';
  });

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
    // If the click is inside the host element (our complete navbar dropdown), do nothing
    if (this.eRef.nativeElement.contains(event.target)) {
      return;
    }
    // If the click is outside, close the dropdown
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
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
