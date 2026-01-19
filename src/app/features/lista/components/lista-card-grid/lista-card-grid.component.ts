import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ListaModel } from '../../models/lista.model'; // Updated import
import { ListaCompraService } from '../../services/lista-compra.service';
import { Page } from '../../../../shared/pipes/page.model';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ListaItensViewComponent } from '../lista-itens-view/lista-itens-view.component';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-lista-card-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    ListaItensViewComponent,
    MatExpansionModule,
    CurrencyPipe,
  ],
  templateUrl: './lista-card-grid.component.html',
  styleUrl: './lista-card-grid.component.scss',
})
export class ListaCardGridComponent implements OnInit {
  private listaCompraService: ListaCompraService = inject(ListaCompraService);
  page?: Page<ListaModel>; // Updated from Lista
  pageSizeOptions = [5, 10, 20];
  defaultPageSize = 10;
  loading = false;
  mensagemErro: string = '';
  deveExibirMensagem = false;

  ngOnInit() {
    this.carregarPagina(0, this.defaultPageSize);
  }

  carregarPagina(page: number, size: number) {
    this.loading = true;

    this.listaCompraService.getListaCompras(page, size).subscribe({
      next: (res) => {
        this.page = res;
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro =
          err.error?.detail || 'Erro ao carregar listas de compra.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.carregarPagina(event.pageIndex, event.pageSize);
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}
