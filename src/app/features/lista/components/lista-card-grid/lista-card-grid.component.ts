import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';

import { ListaModel } from '../../models/lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ListaItensViewComponent } from '../lista-itens-view/lista-itens-view.component';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';

@Component({
  selector: 'app-lista-card-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    CurrencyPipe,
    RouterLink,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    ListaItensViewComponent,
    InfiniteScrollComponent,
  ],
  templateUrl: './lista-card-grid.component.html',
  styleUrl: './lista-card-grid.component.scss',
})
export class ListaCardGridComponent implements OnInit {
  private listaCompraService = inject(ListaCompraService);

  listas: ListaModel[] = [];
  page = 0;
  size = 10;
  loading = false;
  isLastPage = false;
  mensagemErro = '';
  deveExibirMensagem = false;

  ngOnInit(): void {
    this.loadNextPage();
  }

  loadNextPage(): void {
    if (this.loading || this.isLastPage) {
      return;
    }

    this.loading = true;

    this.listaCompraService.getListaCompras(this.page, this.size).subscribe({
      next: (res) => {
        this.listas = [...this.listas, ...res.content];
        this.isLastPage = res.last;
        this.page++;
      },
      error: (err) => {
        this.mensagemErro =
          err.error?.detail || 'Erro ao carregar listas de compra.';
        this.deveExibirMensagem = true;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}
