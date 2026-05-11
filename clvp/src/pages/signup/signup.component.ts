import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/auth.service';
import { NotificationService } from '../../app/core/notification.service';
import { LoaderService } from '../../app/core/loader.service';
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AnimatedBgComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private ns = inject(NotificationService);
  private loader = inject(LoaderService);

  isSubmitting = false;
  showPassword = false;

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
  });

  togglePwd() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.isSubmitting) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.error('Please fill all fields correctly.');
      return;
    }

    this.isSubmitting = true;
    this.loader.show();

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.auth.signUp(email, password, name);

      // ✅ Success modal
      this.ns.success('Account created successfully! You are now logged in.');

      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      const msg = e?.message ?? 'Signup failed. Please try again.';
      this.ns.error(msg);
    } finally {
      this.isSubmitting = false;
      this.loader.hide();
    }
  }

  async loginWithGoogle() {
    try {
      await this.auth.loginWithGoogle();
    } catch (e: any) {
      this.ns.error('Failed to signup with Google.');
    }
  }
}