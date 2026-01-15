import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, ParamMap } from '@angular/router';
import { ListaCompraService } from '../../services/lista-compra.service';
import { Lista } from '../../models/lista.model';
import { ItemListaDTO } from '../../models/item-lista.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { forkJoin, Observable, Subscription, Subject } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Page } from '../../../../shared/pipes/page.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ItemAlterado } from '../../models/item-alterado.model';
import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';
import { InfiniteScrollComponent } from '../../../../shared/components/infinite-scroll/infinite-scroll.component';

@Component({
  selector: 'app-lista-edit',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    MatDialogModule,
    RouterLink,
    InfiniteScrollComponent,
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss',
})
export class ListaEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog); // Re-add MatDialog injection

  listaId!: string;
  lista!: Lista;
  itensPage: Page<ItemListaDTO> | null = null;
  private initialItensState: Map<string, ItemListaDTO> = new Map();
  private pendingItemChanges: Map<string, number> = new Map();

  mensagemErro: string = '';
  deveExibirMensagem = false;
  totalListaValor: number = 0;
  loadingInitial = true;
  loadingScroll = false;

  currentPage: number = 0;
  isLastPage: boolean = false;

  private routeSubscription!: Subscription;
  private quantityChangeSubject = new Subject<void>();
  private debounceSubscription!: Subscription;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.listaId = params.get('id')!;
        this.currentPage = 0;
        this.isLastPage = false;
        this.itensPage = null;
        this.loadListaDetails();
      }
    );

    this.debounceSubscription = this.quantityChangeSubject
      .pipe(
        debounceTime(3000),
        tap(() => {
          if (this.pendingItemChanges.size > 0) {
            this.deveExibirMensagem = false;
          }
        }),
        switchMap(() => this._processPendingChanges())
      )
      .subscribe({
        error: (err) => {
          this.deveExibirMensagem = true;
          this.mensagemErro =
            err.error?.detail || 'Erro ao salvar alterações na lista.';
        },
      });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.debounceSubscription?.unsubscribe();
  }

  loadListaDetails(): void {
    this.loadingInitial = true;
    this.deveExibirMensagem = false;

    this.listaCompraService.getListaById(this.listaId).subscribe({
      next: (listaResponse: Lista) => {
        this.lista = listaResponse;
        this.loadListaItems(true); // Indicate initial load
      },
      error: () => {
        this.loadingInitial = false;
      },
    });
  }

  loadListaItems(isInitialLoad: boolean = false): void {
    if (this.isLastPage || this.loadingScroll) return;

    this.loadingScroll = true;

    this.listaCompraService
      .getItensPorLista(this.listaId, this.currentPage, 10)
      .subscribe({
        next: (pageResponse: Page<ItemListaDTO>) => {
          if (!this.itensPage) {
            this.itensPage = pageResponse;

            this.initialItensState.clear();
            pageResponse.content.forEach((item: ItemListaDTO) => {
              this.initialItensState.set(item.id, { ...item });
            });
          } else {
            this.itensPage = {
              ...this.itensPage,
              content: [...this.itensPage.content, ...pageResponse.content],
              last: pageResponse.last,
              totalElements: pageResponse.totalElements,
            };
          }

          this.isLastPage = pageResponse.last;
          this.currentPage++;
          this.calculateTotalValue();
          this.loadingScroll = false;
          if (isInitialLoad) {
            this.loadingInitial = false;
          }
        },
        error: () => {
          this.loadingScroll = false;
          if (isInitialLoad) {
            this.loadingInitial = false;
          }
        },
      });
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }

  incrementarQuantidade(item: ItemListaDTO): void {
    item.quantidade++;
    this.pendingItemChanges.set(item.id, item.quantidade);
    this.calculateTotalValue();
    this.quantityChangeSubject.next();
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    if (item.quantidade > 0) {
      item.quantidade--;
      this.pendingItemChanges.set(item.id, item.quantidade);
    }

    this.calculateTotalValue();
    this.quantityChangeSubject.next();
  }

  private calculateTotalValue(): void {
    if (!this.itensPage || !this.itensPage.content) {
      this.totalListaValor = 0;
      return;
    }
    this.totalListaValor = this.itensPage.content.reduce((sum, item) => {
      const preco =
        item.itemOferta && item.itemOferta.preco ? item.itemOferta.preco : 0;
      return sum + item.quantidade * preco;
    }, 0);
  }

  private _processPendingChanges(): Observable<any> {
    const itensAlterados: ItemAlterado[] = [];

    this.pendingItemChanges.forEach((newQuantity, itemId) => {
      const originalItem = this.initialItensState.get(itemId);
      const originalQuantity = originalItem ? originalItem.quantidade : 0;

      const item =
        this.itensPage?.content?.find((i) => i.id === itemId) || originalItem;
      if (item) {
        itensAlterados.push({
          id: item.id,
          quantidade: newQuantity, // Send newQuantity (absolute target quantity)
        });
      }
    });

    const observables: Observable<any>[] = [];
    if (itensAlterados.length > 0) {
      observables.push(
        this.listaCompraService.alterarItens(this.listaId, itensAlterados)
      );
    }

    if (observables.length > 0) {
      return forkJoin(observables).pipe(
        tap({
          next: () => {
            this.pendingItemChanges.clear();
            this.initialItensState.clear();
            this.reloadItens(); // Reload all items to get fresh state from server
          },
          error: (err) => {
            this.deveExibirMensagem = true;
            this.mensagemErro =
              err.error?.detail || 'Erro ao salvar alterações na lista.';
          },
        })
      );
    } else {
      return new Observable((observer) => {
        // Return an observable even if no changes
        observer.next(undefined);
        observer.complete();
      });
    }
  }

  private reloadItens(): void {
    this.currentPage = 0;
    this.isLastPage = false;
    this.itensPage = null;
    this.loadListaItems();
  }

  trackByItemId(index: number, item: ItemListaDTO): string {
    return item.id;
  }

  openAddItemsModal(): void {
    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '800px', // Adjust width as needed
      // Optionally pass data to the modal, e.g., this.listaId
      // data: { listaId: this.listaId }
    });

    dialogRef.afterClosed().subscribe((result: { itemOfertaId: string, quantidade: number }[]) => {
      if (result && result.length > 0) {
        this.loadingInitial = true; // Show loading spinner
        this.listaCompraService.adicionarItensALista(this.listaId, result).subscribe({
          next: () => {
            this.pendingItemChanges.clear(); // Clear pending changes from previous session
            this.initialItensState.clear();
            this.reloadItens(); // Reload the list to reflect added items
            this.deveExibirMensagem = false; // Clear any previous error message
            this.loadingInitial = false; // Hide loading spinner
          },
          error: (err) => {
            this.loadingInitial = false;
            this.deveExibirMensagem = true;
            this.mensagemErro = err.error?.detail || 'Erro ao adicionar itens à lista.';
          }
        });
      }
    });
  }
}
