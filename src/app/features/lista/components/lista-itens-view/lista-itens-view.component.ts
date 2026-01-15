import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ItemListaDTO } from '../../models/item-lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { Page } from '../../../../shared/pipes/page.model';
// MatPaginatorModule and PageEvent removed
import { Lista } from '../../models/lista.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { InfiniteScrollComponent } from '../../../../shared/components/infinite-scroll/infinite-scroll.component';

@Component({
  selector: 'app-lista-itens-view',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    // MatPaginatorModule removed
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    InfiniteScrollComponent, // Add InfiniteScrollComponent
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

  // Paginator options removed
  currentPage: number = 0; // Current page for infinite scroll
  isLastPage: boolean = false; // Flag to indicate if the last page has been loaded
  loadingScroll = false; // Loading state for infinite scroll

  ngOnInit(): void {
    this.loadItens(true); // Load initial items, resetting pagination
  }

  loadItens(reset: boolean = false): void {
    if (!this.lista) return;

    if (reset) {
      this.currentPage = 0;
      this.isLastPage = false;
      this.page = undefined;
    }

    if (this.isLastPage || this.loadingItens) { // Use loadingItens for initial/scroll loading
      return;
    }

    this.loadingItens = true;
    this.deveExibirMensagem = false;

    // Fetch 10 items per page for infinite scroll
    this.listaCompraService.getItensPorLista(this.lista.id!, this.currentPage, 10).subscribe({
      next: (response: Page<ItemListaDTO>) => {
        if (!this.page || reset) {
          this.page = response;
        } else {
          this.page.content = [...this.page.content, ...response.content];
          this.page.last = response.last;
          this.page.totalElements = response.totalElements;
          // Update other page properties if needed, like page.number, page.totalPages
        }
        this.isLastPage = response.last;
        this.currentPage++;
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

  // onPageChange removed

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}
