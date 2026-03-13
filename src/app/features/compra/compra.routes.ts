import { Routes } from '@angular/router';

export const COMPRA_ROUTES: Routes = [
  {
    path: 'iniciar/:id',
    loadComponent: () => import('./pages/iniciar-compra/iniciar-compra.component').then(m => m.IniciarCompraComponent),
    data: { title: 'Iniciar Compra', showBackButton: true }
  },
  {
    path: 'visualizar/:id',
    loadComponent: () => import('../lista/pages/lista-visualizar/lista-visualizar.component').then(m => m.ListaVisualizarComponent),
    data: { title: 'Visualizar Compra', showBackButton: true }
  },
  {
    path: 'sucesso',
    loadComponent: () => import('./pages/iniciar-compra/iniciar-compra.component').then(m => m.IniciarCompraComponent),
    data: { title: 'Compra Finalizada', showBackButton: true }
  }
];
