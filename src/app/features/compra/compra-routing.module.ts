import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IniciarCompraComponent } from './pages/iniciar-compra/iniciar-compra.component';
import { ListaVisualizarComponent } from '../lista/pages/lista-visualizar/lista-visualizar.component';

const routes: Routes = [
  {
    path: 'iniciar/:id', // Ex: /compra/iniciar/123
    component: IniciarCompraComponent,
  },
  {
    path: 'visualizar/:id',
    component: ListaVisualizarComponent,
  },
  // TODO: Adicionar rota para tela de sucesso ou resumo da compra
  {
    path: 'sucesso',
    component: IniciarCompraComponent, // Placeholder, crie um componente de sucesso
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompraRoutingModule { }
