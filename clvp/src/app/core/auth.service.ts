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
      this.cachedJwt = null; // Clear token if invalid
      return false;
    }
  }

  private cachedJwt: string | null = null;
  private jwtExpiresAt: number = 0;

  async getJwt(): Promise<string | null> {
    if (!this.currentUser()) return null; // Not logged in
    if (this.cachedJwt && Date.now() < this.jwtExpiresAt) return this.cachedJwt;
    try {
      const { jwt } = await this.appwrite.account.createJWT();
      this.cachedJwt = jwt;
      // Appwrite JWTs normally last 15 mins, let's cache for 14 mins to be safe
      this.jwtExpiresAt = Date.now() + 14 * 60 * 1000;
      return jwt;
    } catch {
      return null;
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
