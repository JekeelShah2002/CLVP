import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ID } from 'appwrite';
import { AppwriteService } from './appwrite.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private appwrite: AppwriteService,
    private router: Router,
  ) {}

  // Check if there is a valid session (cookie-based)
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.appwrite.account.get(); // gets current user if session is valid
      return true;
    } catch {
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
  }

  async logout() {
    // Delete "current session"
    await this.appwrite.account.deleteSession('current');
    await this.router.navigate(['/login']);
  }
}
