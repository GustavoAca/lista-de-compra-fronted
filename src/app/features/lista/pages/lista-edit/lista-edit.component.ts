import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Subject, Subscription, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';

import { ListaCompraService } from '../../services/lista-compra.service';
import { Lista } from '../../models/lista.model';
import { ItemListaDTO } from '../../models/item-lista.model';
import { ItemAlterado } from '../../models/item-alterado.model';

import { Page } from '../../../../shared/pipes/page.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { InfiniteScrollComponent } from '../../../../shared/components/infinite-scroll/infinite-scroll.component';
import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';

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
    MatCardModule, // Add MatCardModule
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss',
})
export class ListaEditComponent implements OnInit, OnDestroy {

  // =========================
  // Injeções
  // =========================
  private route = inject(ActivatedRoute);
  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog);

  // =========================
  // Estado público (template)
  // =========================
  listaId!: string;
  lista!: Lista;
  itensPage: Page<ItemListaDTO> | null = null;

  totalListaValor = 0;
  loadingInitial = true;
  loadingScroll = false;

  deveExibirMensagem = false;
  mensagemErro = '';

  // =========================
  // Paginação
  // =========================
  currentPage = 0;
  isLastPage = false;

  // =========================
  // Estado interno
  // =========================
  private initialItensState = new Map<string, ItemListaDTO>();
  private pendingItemChanges = new Map<string, number>();

  private quantityChangeSubject = new Subject<void>();

  // =========================
  // Subscriptions
  // =========================
  private routeSubscription!: Subscription;
  private debounceSubscription!: Subscription;

  // =========================
  // Lifecycle
  // =========================
  ngOnInit(): void {
    this.observeRoute();
    this.observeDebouncedChanges();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.debounceSubscription?.unsubscribe();
  }

  // =========================
  // Rota / Inicialização
  // =========================
  private observeRoute(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (!id) return;

      this.initializeLista(id);
    });
  }

  private initializeLista(listaId: string): void {
    this.listaId = listaId;
    this.resetState();
    this.resetPagination();
    this.loadLista();
  }

  // =========================
  // Carregamento da lista
  // =========================
  private loadLista(): void {
    this.loadingInitial = true;
    this.clearError();

    this.listaCompraService.getListaById(this.listaId).subscribe({
      next: lista => {
        this.lista = lista;
        this.loadListaItems(true);
      },
      error: (err: any) => {
        this.loadingInitial = false;
        this.showError(err.error?.detail || 'Erro ao carregar a lista.');
      }
    });
  }

  // =========================
  // Itens / Paginação
  // =========================
  loadListaItems(isInitialLoad = false): void {
    if (this.loadingScroll || this.isLastPage) return;

    this.loadingScroll = true;

    this.listaCompraService
      .getItensPorLista(this.listaId, this.currentPage, 10)
      .subscribe({
        next: page => this.onItemsLoaded(page, isInitialLoad),
        error: (err: any) => this.onItemsLoadError(isInitialLoad, err)
      });
  }

  private onItemsLoaded(page: Page<ItemListaDTO>, isInitialLoad: boolean): void {
    if (!this.itensPage) {
      this.initializeItems(page);
    } else {
      this.appendItems(page);
    }

    this.isLastPage = page.last;
    this.currentPage++;
    this.calculateTotalValue();

    this.loadingScroll = false;
    if (isInitialLoad) this.loadingInitial = false;
  }

  private onItemsLoadError(isInitialLoad: boolean, err: any): void {
    this.loadingScroll = false;
    if (isInitialLoad) this.loadingInitial = false;
    this.showError(err.error?.detail || 'Erro ao carregar itens da lista.');
  }

  private initializeItems(page: Page<ItemListaDTO>): void {
    this.itensPage = page;
    this.initialItensState.clear();

    page.content.forEach(item =>
      this.initialItensState.set(item.id!, { ...item })
    );
  }

  private appendItems(page: Page<ItemListaDTO>): void {
    this.itensPage = {
      ...this.itensPage!,
      content: [...this.itensPage!.content, ...page.content],
      last: page.last,
      totalElements: page.totalElements
    };
  }

  // =========================
  // Quantidade / Alterações
  // =========================
  incrementarQuantidade(item: ItemListaDTO): void {
    item.quantidade++;
    this.registerItemChange(item);
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    if (item.quantidade === 0) return;
    item.quantidade--;
    this.registerItemChange(item);
  }

  private registerItemChange(item: ItemListaDTO): void {
    this.pendingItemChanges.set(item.id!, item.quantidade);
    this.calculateTotalValue();
    this.quantityChangeSubject.next();
  }

  // =========================
  // Persistência (debounce)
  // =========================
  private observeDebouncedChanges(): void {
    this.debounceSubscription = this.quantityChangeSubject
      .pipe(
        debounceTime(3000),
        switchMap(() => this.persistPendingChanges())
      )
      .subscribe({
        error: (err: any) => this.showError(
          err.error?.detail || 'Erro ao salvar alterações.'
        )
      });
  }

  private persistPendingChanges(): Observable<any> {
    if (this.pendingItemChanges.size === 0) {
      return new Observable(observer => observer.complete());
    }

    const itensAlterados = this.buildItensAlterados();

    return this.listaCompraService
      .alterarItens(this.listaId, itensAlterados)
      .pipe(
        tap(() => this.onPersistSuccess())
      );
  }

  private buildItensAlterados(): ItemAlterado[] {
    const itens: ItemAlterado[] = [];

    this.pendingItemChanges.forEach((quantidade, id) => {
      itens.push({ id, quantidade });
    });

    return itens;
  }

  private onPersistSuccess(): void {
    this.pendingItemChanges.clear();
    this.initialItensState.clear();
    this.reloadItens();
  }

  // =========================
  // Modal de adicionar itens
  // =========================
  openAddItemsModal(): void {
    const vendedorId = this.resolveVendedorId();

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '800px',
      data: { vendedorId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result || result.length === 0) return;
      this.addItemsToLista(result);
    });
  }

  private addItemsToLista(itens: { itemOfertaId: string; quantidade: number }[]): void {
    this.loadingInitial = true;

    this.listaCompraService.adicionarItensALista(this.listaId, itens).subscribe({
      next: () => {
        this.pendingItemChanges.clear();
        this.initialItensState.clear();
        this.reloadItens();
        this.loadingInitial = false;
      },
      error: (err: any) => {
        this.loadingInitial = false;
        this.showError(err.error?.detail || 'Erro ao adicionar itens.');
      }
    });
  }

  private resolveVendedorId(): string | null {
    return this.itensPage?.content?.[0]?.itemOferta?.vendedor?.id ?? null;
  }

  // =========================
  // Utilitários
  // =========================
  private calculateTotalValue(): void {
    if (!this.itensPage) {
      this.totalListaValor = 0;
      return;
    }

    this.totalListaValor = this.itensPage.content.reduce((sum, item) => {
      const preco = item.itemOferta?.preco ?? 0;
      return sum + item.quantidade * preco;
    }, 0);
  }

  private reloadItens(): void {
    this.resetPagination();
    this.itensPage = null;
    this.loadListaItems();
  }

  private resetPagination(): void {
    this.currentPage = 0;
    this.isLastPage = false;
  }

  private resetState(): void {
    this.itensPage = null;
    this.pendingItemChanges.clear();
    this.initialItensState.clear();
    this.clearError();
  }

  trackByItemId(_: number, item: ItemListaDTO): string {
    return item.id!;
  }

  // =========================
  // Mensagens
  // =========================
  onAlertClosed(): void {
    this.clearError();
  }

  private showError(message: string): void {
    this.deveExibirMensagem = true;
    this.mensagemErro = message;
  }

  private clearError(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}
