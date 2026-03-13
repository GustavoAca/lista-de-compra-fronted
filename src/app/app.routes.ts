import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { autoLoginGuard } from './core/guards/auto-login.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard],
    data: { title: 'Minhas Listas' }
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [autoLoginGuard],
    data: { hideHeader: true }
  },
  {
    path: 'lista/editar/:id',
    loadComponent: () => import('./features/lista/pages/lista-edit/lista-edit.component').then(m => m.ListaEditComponent),
    canActivate: [authGuard],
    data: { title: 'Editar Lista', showBackButton: true }
  },
  {
    path: 'lista/criar',
    loadComponent: () => import('./features/lista/pages/lista-create/lista-create.component').then(m => m.ListaCreateComponent),
    canActivate: [authGuard],
    data: { title: 'Criar Nova Lista', showBackButton: true }
  },
  {
    path: 'compra',
    loadChildren: () => import('./features/compra/compra.routes').then(m => m.COMPRA_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { 
    path: 'oauth/callback/:provider', 
    loadComponent: () => import('./features/auth/components/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent),
    data: { hideHeader: true }
  }
];