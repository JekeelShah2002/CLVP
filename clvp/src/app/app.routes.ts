import { Routes } from '@angular/router';
import { LoginComponent } from '../pages/login/login.component';
import { HomeComponent } from '../pages/home/home.component';
import { SignupComponent } from '../pages/signup/signup.component';
import { authGuard } from './core/auth.guard';
import { AboutComponent } from '../pages/about/about.component';
import { CustomersComponent } from '../pages/customers/customers.component';
import { DocsComponent } from '../pages/docs/docs.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { LandingComponent } from '../pages/landing/landing.component';
import { CustomerDetailComponent } from '../pages/customer-detail/customer-detail.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignupComponent },
  { path: 'about', component: AboutComponent },
  { path: 'docs', component: DocsComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard] },
  { path: 'customers/:id', component: CustomerDetailComponent, canActivate: [authGuard] },
  { path: '**', component: PageNotFoundComponent },
];
