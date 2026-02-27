import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ID, Models } from 'appwrite';
import { AppwriteService } from './appwrite.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Centralized reactive state for the currently logged in user
  public currentUser = signal<Models.User<Models.Preferences> | null>(null);

  constructor(
    private appwrite: AppwriteService,
    private router: Router,
  ) { }

  // Check if there is a valid session (cookie-based)
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.appwrite.account.get(); // gets current user if session is valid
      this.currentUser.set(user);
      return true;
    } catch {
      this.currentUser.set(null);
      return false;
    }
  }

  async signUp(email: string, password: string, name?: string) {
    // Create user account
    await this.appwrite.account.create(ID.unique(), email, password, name);
    // Optional: auto-login after signup
    await this.login(email, password);
  }

  async login(email: string, password: string) {
    // Creates a session (cookie stored by Appwrite)
    try {
      await this.appwrite.account.deleteSession('current');
    } catch {
      // no active session, ignore
    }

    await this.appwrite.account.createEmailPasswordSession(email, password);
    // Update the signal state
    await this.isLoggedIn();
  }

  async logout() {
    // Delete "current session"
    await this.appwrite.account.deleteSession('current');
    // Clear user state
    this.currentUser.set(null);
    await this.router.navigate(['/login']);
  }
}
