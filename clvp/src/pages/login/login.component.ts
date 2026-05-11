import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../app/core/auth.service';
import { NotificationService } from '../../app/core/notification.service';
import { LoaderService } from '../../app/core/loader.service';
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AnimatedBgComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private ns = inject(NotificationService);
  private loader = inject(LoaderService);

  isSubmitting = false;
  showPassword = false;

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
    remember: this.fb.control(false),
  });

  async onSubmit() {
    if (this.isSubmitting) return; // prevent double submit

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.error('Please fill all fields correctly (Password must be at least 8 chars).');
      return;
    }

    this.isSubmitting = true;
    this.loader.show();

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email, password);

      // ✅ Success Modal
      this.ns.success('Login successful! Welcome back.');

      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      // ❌ Error Modal
      this.ns.error('Invalid email or password. Please try again.');
    } finally {
      this.isSubmitting = false;
      this.loader.hide();
    }
  }

  togglePwd() {
    this.showPassword = !this.showPassword;
  }

  async loginWithGoogle() {
    try {
      await this.auth.loginWithGoogle();
    } catch (e: any) {
      this.ns.error('Failed to login with Google.');
    }
  }
}