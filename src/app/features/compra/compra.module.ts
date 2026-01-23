import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CompraRoutingModule } from './compra-routing.module';
import { IniciarCompraComponent } from './pages/iniciar-compra/iniciar-compra.component';
import { ListaVisualizarComponent } from '../lista/pages/lista-visualizar/lista-visualizar.component';

@NgModule({
  declarations: [], // No declarations for standalone components
  imports: [
    CommonModule,
    CompraRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    // Standalone components used in this module's routes
    IniciarCompraComponent,
    ListaVisualizarComponent,
  ]
})
export class CompraModule { }
