import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Subject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, switchMap, tap, expand, takeWhile, finalize } from 'rxjs/operators';

import { ListaCompraService } from '../../services/lista-compra.service';
import { ListaModel } from '../../models/lista.model'; // Updated from Lista
import { ItemListaModel } from '../../models/item-lista.model'; // Updated from ItemListaDTO
import { ItemAlterado } from '../../models/item-alterado.model';

import { Page } from '../../../../shared/pipes/page.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';
import { ItemOferta } from '../../models/item-oferta.model';

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
    MatCardModule,
    ItemListDisplayComponent, // Add the new component
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
  lista!: ListaModel; // Updated from Lista
  itensPage: Page<ItemListaModel> | null = null; // Updated from ItemListaDTO
  allItems: ItemListaModel[] = []; // Stores all fetched items

  totalListaValor = 0;
  loadingInitial = true;

  deveExibirMensagem = false;
  mensagemErro = '';

  // =========================
  // Paginação
  // =========================
  currentPage = 0;

  // =========================
  // Estado interno
  // =========================
  private initialItensState = new Map<string, ItemListaModel>(); // Updated from ItemListaDTO
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
        this.loadListaItems(); // Now triggers full load
      },
      error: (err: any) => {
        this.loadingInitial = false;
        this.showError(err.error?.detail || 'Erro ao carregar a lista.');
      }
    });
  }

  // =========================
  // Itens / Carregamento Completo
  // =========================
  loadListaItems(): void {
    this.loadingInitial = true;
    this.allItems = []; // Clear previous items
    this.currentPage = 0; // Reset page for full fetch

    this._fetchPage()
      .pipe(
        finalize(() => this.loadingInitial = false) // Ensure loading is turned off
      )
      .subscribe({
        next: () => {
          this.onAllItemsLoaded();
        },
        error: (err: any) => {
          this.showError(err.error?.detail || 'Erro ao carregar itens da lista.');
        }
      });
  }

  private _fetchPage(): Observable<Page<ItemListaModel>> {
    return this.listaCompraService.getItensPorLista(this.listaId, this.currentPage, 10).pipe(
      tap(page => {
        this.allItems.push(...page.content);
        this.currentPage++;
      }),
      expand(page => page.last ? of() : this._fetchPage()),
      takeWhile(page => !page.last, true) // Include the last page in the result stream
    );
  }

  private onAllItemsLoaded(): void {
    // Create a mock Page object to store all items for existing logic
    this.itensPage = {
      content: this.allItems,
      last: true,
      totalPages: 1,
      totalElements: this.allItems.length,
      size: this.allItems.length,
      number: 0,
      first: true,
      numberOfElements: this.allItems.length,
      empty: this.allItems.length === 0,
      sort: {
        sorted: false,
        unsorted: true,
        empty: true
      }
    };

    this.initialItensState.clear();
    this.allItems.forEach(item =>
      this.initialItensState.set(item.id!, { ...item })
    );

    this.calculateTotalValue();
  }

  // =========================
  // Quantidade / Alterações
  // =========================
  incrementarQuantidade(item: ItemListaModel): void { // Updated from ItemListaDTO
    item.quantidade++;
    this.registerItemChange(item);
  }

  decrementarQuantidade(item: ItemListaModel): void { // Updated from ItemListaDTO
    if (item.quantidade === 0) return;
    item.quantidade--;
    this.registerItemChange(item);
  }

  private registerItemChange(item: ItemListaModel): void { // Updated from ItemListaDTO
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

  private addItemsToLista(itens: { itemOferta: ItemOferta; quantidade: number }[]): void {
    this.loadingInitial = true;
      const payload = itens.map(i => ({
      itemOfertaId: i.itemOferta.id,
      quantidade: i.quantidade
      }));

    this.listaCompraService.adicionarItensALista(this.listaId, payload).subscribe({
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
    // No longer rely on itensPage.content[0] as allItems is the source of truth now
    return this.allItems?.[0]?.itemOferta?.vendedor?.id ?? null;
  }

  // =========================
  // Utilitários
  // =========================
  private calculateTotalValue(): void {
    if (this.allItems.length === 0) {
      this.totalListaValor = 0;
      return;
    }

    this.totalListaValor = this.allItems.reduce((sum, item) => {
      const preco = item.itemOferta?.preco ?? 0;
      return sum + item.quantidade * preco;
    }, 0);
  }

  private reloadItens(): void {
    // Reset state and trigger a full reload
    this.resetState();
    this.loadListaItems();
  }

  private resetState(): void {
    this.itensPage = null;
    this.allItems = [];
    this.pendingItemChanges.clear();
    this.initialItensState.clear();
    this.clearError();
    this.currentPage = 0; // Ensure current page is reset
  }

  trackByItemId(_: number, item: ItemListaModel): string { // Updated from ItemListaDTO
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
