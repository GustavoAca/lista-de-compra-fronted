import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ItemListaDTO } from '../../models/item-lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { Page } from '../../../../shared/pipes/page.model';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Lista } from '../../models/lista.model';

import { MatButtonModule } from '@angular/material/button';


import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lista-itens-view',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatPaginatorModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './lista-itens-view.component.html',
  styleUrl: './lista-itens-view.component.scss',
})
export class ListaItensViewComponent implements OnInit {
  @Input() lista!: Lista;

  private listaCompraService = inject(ListaCompraService);


  page?: Page<ItemListaDTO>;
  loadingItens = false;
  mensagemErro: string = '';
  deveExibirMensagem = false;

  pageSizeOptions = [5, 10, 20];
  defaultPageSize = 5;



  ngOnInit(): void {
    this.loadItens();
  }

  loadItens(page = 0, size = this.defaultPageSize): void {
    if (!this.lista) return;

    this.loadingItens = true;
    this.deveExibirMensagem = false;

    this.listaCompraService.getItensPorLista(this.lista.id!, page, size).subscribe({
      next: (response) => {
        this.page = response;
        this.loadingItens = false;
      },
      error: (err) => {
        this.loadingItens = false;
        this.deveExibirMensagem = true;
        this.mensagemErro =
          err.error?.detail || 'Erro ao carregar os itens da lista.';
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.loadItens(event.pageIndex, event.pageSize);
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }








}
