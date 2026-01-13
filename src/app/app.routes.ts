import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { OauthCallbackComponent } from './features/auth/components/oauth-callback/oauth-callback.component';
import { HomeComponent } from './features/home/pages/home/home.component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { path: 'oauth/callback/:provider', component: OauthCallbackComponent }
];
