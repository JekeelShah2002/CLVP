import { Routes } from '@angular/router';
import { LoginComponent } from '../pages/login/login.component';
import { HomeComponent } from '../pages/home/home.component';
import { SignupComponent } from '../pages/signup/signup.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignupComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  // { path: '**', component: PageNotFoundComponent },
];
