import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { OauthCallbackComponent } from './features/auth/components/oauth-callback/oauth-callback.component';
import { HomeComponent } from './features/home/pages/home/home.component';
import { ListaEditComponent } from './features/lista/pages/lista-edit/lista-edit.component';
import { ListaCreateComponent } from './features/lista/pages/lista-create/lista-create.component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Minhas Listas' }
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { hideHeader: true }
  },
  {
    path: 'lista/editar/:id',
    component: ListaEditComponent,
    data: { title: 'Editar Lista', showBackButton: true }
  },
  {
    path: 'lista/criar',
    component: ListaCreateComponent,
    data: { title: 'Criar Nova Lista', showBackButton: true }
  },
  {
    path: 'compra', // New route for the compra feature
    loadChildren: () => import('./features/compra/compra.module').then(m => m.CompraModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { 
    path: 'oauth/callback/:provider', 
    component: OauthCallbackComponent,
    data: { hideHeader: true }
  }
];