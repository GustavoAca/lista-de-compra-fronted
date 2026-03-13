import { Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ItemListaModel } from '../../models/item-lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { InfiniteScrollComponent } from '../../../../shared/components/infinite-scroll/infinite-scroll.component';
import { ListaModel } from '../../models/lista.model';

@Component({
  selector: 'app-lista-itens-view',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    InfiniteScrollComponent,
  ],
  templateUrl: './lista-itens-view.component.html',
  styleUrl: './lista-itens-view.component.scss',
})
export class ListaItensViewComponent implements OnInit {
  // Input reativo
  lista = input.required<ListaModel>();

  private listaCompraService = inject(ListaCompraService);

  // Signals para Gerenciamento de Estado
  items = signal<ItemListaModel[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  isLastPage = signal(false);
  error = signal<string | null>(null);

  // Computed
  hasError = computed(() => !!this.error());

  ngOnInit(): void {
    this.loadItens(true);
  }

  loadItens(reset: boolean = false): void {
    if (reset) {
      this.currentPage.set(0);
      this.isLastPage.set(false);
      this.items.set([]);
    }

    if (this.isLastPage() || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.listaCompraService.getItensPorLista(this.lista().id!, this.currentPage(), 10).subscribe({
      next: (response) => {
        this.items.update(prev => [...prev, ...response.content]);
        this.isLastPage.set(response.last);
        this.currentPage.update(p => p + 1);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Erro ao carregar os itens da lista.');
      },
    });
  }

  onAlertClosed(): void {
    this.error.set(null);
  }
}
