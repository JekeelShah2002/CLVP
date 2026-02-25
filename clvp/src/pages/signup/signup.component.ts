import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

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
      alert('❌ Please fill all fields correctly.');
      return;
    }

    this.isSubmitting = true;

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.auth.signUp(email, password, name);

      // ✅ Success modal
      alert('✅ Account created successfully! You are now logged in.');

      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      const msg = e?.message ?? 'Signup failed. Please try again.';
      alert(`❌ ${msg}`);
    } finally {
      this.isSubmitting = false;
    }
  }
}