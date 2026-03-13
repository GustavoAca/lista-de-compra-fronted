import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-lista-visualizar',
  standalone: true,
  imports: [
    CommonModule,
    InfiniteScrollComponent,
    LoadingSpinnerComponent,
    MatCardModule,
    MatIconModule,
    CurrencyPipe
  ],
  templateUrl: './lista-visualizar.component.html',
  styleUrls: ['./lista-visualizar.component.scss']
})
export class ListaVisualizarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private listaCompraService = inject(ListaCompraService);
  private destroyRef = inject(DestroyRef);

  // Signals
  listaId = signal<string | null>(null);
  list = signal<ListaModel | null>(null);
  items = signal<ItemListaModel[]>([]);
  loading = signal(true);
  loadingItems = signal(false);
  isLastPage = signal(false);
  
  currentPage = 0;
  pageSize = 10;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    
    this.listaId.set(id);
    this.loadLista(id);
  }

  private loadLista(id: string): void {
    this.loading.set(true);
    this.listaCompraService.getListaById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (listData) => {
        this.list.set(listData);
        this.loading.set(false);
        this.loadMoreItems();
      },
      error: () => this.loading.set(false)
    });
  }

  loadMoreItems(): void {
    const id = this.listaId();
    if (!id || this.loadingItems() || this.isLastPage()) return;

    this.loadingItems.set(true);
    this.listaCompraService.getItensPorLista(id, this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.items.update(prev => [...prev, ...page.content]);

          const currentList = this.list();
          if (currentList && !currentList.vendedor && page.content.length > 0) {
            const firstItemVendedor = page.content[0].itemOferta?.vendedor;
            if (firstItemVendedor?.id) {
              this.list.set({
                ...currentList,
                vendedor: { id: firstItemVendedor.id, nome: firstItemVendedor.nome! }
              });
            }
          }

          this.isLastPage.set(page.last);
          this.currentPage++;
          this.loadingItems.set(false);
        },
        error: () => this.loadingItems.set(false)
      });
  }
}
