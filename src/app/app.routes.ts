import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { OauthCallbackComponent } from './features/auth/components/oauth-callback/oauth-callback.component';
import { HomeComponent } from './features/home/pages/home/home.component';
import { ListaEditComponent } from './features/lista/pages/lista-edit/lista-edit.component';

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
    path: 'lista/editar/:id',
    component: ListaEditComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { path: 'oauth/callback/:provider', component: OauthCallbackComponent }
];
