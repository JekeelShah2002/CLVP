import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../app/core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

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
      return;
    }

    this.isSubmitting = true;

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email, password);

      // ✅ Success Modal
      alert('✅ Login successful! Welcome back.');

      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      // ❌ Error Modal
      alert('❌ Invalid email or password. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  togglePwd() {
    this.showPassword = !this.showPassword;
  }
}