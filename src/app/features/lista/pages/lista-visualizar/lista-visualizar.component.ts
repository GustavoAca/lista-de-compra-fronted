import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

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
  listaId!: string;
  list?: ListaModel;
  items: ItemListaModel[] = [];

  isPageLoading = true;
  areItemsLoading = false;
  isLastPage = false;
  currentPage = 0;
  pageSize = 10;

  constructor(
    private route: ActivatedRoute,
    private listaCompraService: ListaCompraService
  ) { }

  ngOnInit(): void {
    this.listaId = this.route.snapshot.paramMap.get('id')!;
    this.listaCompraService.getListaById(this.listaId).subscribe({
      next: (listData) => {
        this.list = listData;
        this.isPageLoading = false;
        this.loadMoreItems(); // Load first page of items
      },
      error: (err) => {
        console.error("Erro ao carregar detalhes da lista:", err);
        this.isPageLoading = false;
      }
    });
  }

  loadMoreItems(): void {
    if (this.areItemsLoading || this.isLastPage) {
      return;
    }

    this.areItemsLoading = true;
    this.listaCompraService.getItensPorLista(this.listaId, this.currentPage, this.pageSize)
      .subscribe({
        next: (page) => {
          console.table(page.content)
          this.items = [...this.items, ...page.content];
          this.isLastPage = page.last;
          this.currentPage++;
          this.areItemsLoading = false;
        },
        error: (err) => {
          console.error("Erro ao carregar itens da lista:", err);
          this.areItemsLoading = false;
        }
      });
  }
}
