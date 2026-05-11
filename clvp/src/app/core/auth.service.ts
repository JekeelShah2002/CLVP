import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ID, Models, OAuthProvider } from 'appwrite';
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
    console.log('[Auth] Checking session status...');
    try {
      const user = await this.appwrite.account.get(); // gets current user if session is valid
      console.log(`[Auth] Session active. User: ${user.name || user.email || user.$id}`);
      this.currentUser.set(user);
      return true;
    } catch {
      console.log('[Auth] No active session found.');
      this.currentUser.set(null);
      this.cachedJwt = null; // Clear token if invalid
      return false;
    }
  }

  private cachedJwt: string | null = null;
  private jwtExpiresAt: number = 0;

  async getJwt(): Promise<string | null> {
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
    console.log(`[Auth] Signing up new user: ${email}...`);
    // Create user account
    await this.appwrite.account.create(ID.unique(), email, password, name);
    // Optional: auto-login after signup
    await this.login(email, password);
  }

  async login(email: string, password: string) {
    console.log(`[Auth] Attempting login for user: ${email}...`);
    // Creates a new session (cookie stored by Appwrite)
    await this.appwrite.account.createEmailPasswordSession(email, password);
    console.log(`[Auth] Login successful for: ${email}`);
    // Populate the user signal so guards and interceptors work immediately
    await this.isLoggedIn();
    // Clear any stale cached JWT so the next request gets a fresh one
    this.cachedJwt = null;
    this.jwtExpiresAt = 0;
  }

  async loginWithGoogle() {
    console.log('[Auth] Attempting Google OAuth login...');
    this.appwrite.account.createOAuth2Session(
      OAuthProvider.Google,
      `${window.location.origin}/home`,
      `${window.location.origin}/login`
    );
  }

  async logout() {
    console.log('[Auth] Logging out current user...');
    // Delete "current session"
    try {
      await this.appwrite.account.deleteSession('current');
    } catch {
      // already logged out
      console.log('[Auth] Already logged out on server-side.');
    }
    // Clear all state
    console.log('[Auth] Session cleared locally.');
    this.currentUser.set(null);
    this.cachedJwt = null;
    this.jwtExpiresAt = 0;
    await this.router.navigate(['/login']);
  }
}
