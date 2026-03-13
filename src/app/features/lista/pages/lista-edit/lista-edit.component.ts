import { Component, inject, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Subject, Observable, of, throwError } from 'rxjs';
import {
  debounceTime,
  switchMap,
  tap,
  expand,
  takeWhile,
  finalize,
  catchError,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ListaCompraService } from '../../services/lista-compra.service';
import { ListaModel } from '../../models/lista.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ItemAlterado } from '../../models/item-alterado.model';
import { ListaCompraEdicaoRequest } from '../../models/lista-compra-edicao-request.model';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';
import { ItemOferta } from '../../models/item-oferta.model';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';
import { HeaderService } from '../../../../core/services/header.service';

@Component({
  selector: 'app-lista-edit',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    ItemListDisplayComponent,
    MatToolbarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FabButtonComponent
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss',
})
export class ListaEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private headerService = inject(HeaderService);

  // Status de Sincronização
  syncStatus = signal<'synced' | 'saving' | 'error'>('synced');
  
  // Backup para Rollback
  private lastGoodState: ItemListaModel[] = [];

  // Seleção em Lote
  selectedItems = signal<Set<string>>(new Set());
  isSelectionMode = computed(() => this.selectedItems().size > 0);

  // Signals para Estado
  listaId = signal<string | null>(null);
  lista = signal<ListaModel | null>(null);
  itensLista = signal<ItemListaModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Form Group
  listaForm: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    vendedorId: [''],
  });

  // Signals Computados
  totalListaValor = computed(() => this.itensLista().reduce(
    (sum, item) => sum + (item.quantidade * (item.itemOferta?.preco ?? 0)), 0
  ));
  
  totalItensCount = computed(() => this.itensLista().filter(i => i.quantidade > 0).length);
  
  hasChangesInMeta = signal(false);

  // Controle de Alterações Pendentes
  private pendingItemChanges = new Map<string, number>();
  private quantityChangeSubject = new Subject<void>();
  currentPage = 0;

  constructor() {
    // Sincroniza o estado local com o Header Global
    effect(() => {
      this.headerService.updateEditState(
        this.syncStatus(),
        this.totalListaValor(),
        this.totalItensCount()
      );

      // Sincroniza as ações de erro
      if (this.syncStatus() === 'error') {
        this.headerService.retryAction.set(() => this.retrySync());
        this.headerService.rollbackAction.set(() => this.rollbackChanges());
      } else {
        this.headerService.retryAction.set(null);
        this.headerService.rollbackAction.set(null);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID da lista não fornecido.');
      return;
    }
    this.listaId.set(id);
    this.loadLista();
    this.observeDebouncedChanges();
    
    this.listaForm.get('nome')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      if (this.lista()) {
        const hasChanges = val !== this.lista()?.nome;
        this.hasChangesInMeta.set(hasChanges);
      }
    });
  }

  private loadLista(): void {
    const id = this.listaId();
    if (!id) return;

    this.loading.set(true);
    this.listaCompraService.getListaById(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (lista) => {
        this.lista.set(lista);
        this.listaForm.patchValue({
          nome: lista.nome,
          vendedorId: lista.vendedor?.id
        }, { emitEvent: false });
        this.loadListaItems();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Erro ao carregar a lista.');
      },
    });
  }

  private loadListaItems(): void {
    const id = this.listaId();
    if (!id) return;

    this.itensLista.set([]);
    this.currentPage = 0;

    this._fetchPage(id)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.lastGoodState = [...this.itensLista()];
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (err) => this.error.set(err.error?.detail || 'Erro ao carregar itens.'),
      });
  }

  private _fetchPage(id: string): Observable<any> {
    return this.listaCompraService.getItensPorLista(id, this.currentPage, 50).pipe(
      tap((page) => {
        this.itensLista.update(prev => [...prev, ...page.content]);
        this.currentPage++;
      }),
      expand((page) => (page.last ? of() : this._fetchPage(id))),
      takeWhile((page) => !page.last, true)
    );
  }

  incrementarQuantidade(item: ItemListaModel): void {
    this.updateItemQuantity(item.id!, item.quantidade + 1);
  }

  decrementarQuantidade(item: ItemListaModel): void {
    if (item.quantidade > 0) {
      this.updateItemQuantity(item.id!, item.quantidade - 1);
    }
  }

  private updateItemQuantity(id: string, newQty: number): void {
    if (this.pendingItemChanges.size === 0) {
      this.lastGoodState = [...this.itensLista()];
    }

    this.itensLista.update(items => {
      if (newQty === 0) {
        return items.filter(i => i.id !== id);
      }
      return items.map(i => 
        i.id === id ? { ...i, quantidade: newQty } : i
      );
    });
    
    this.pendingItemChanges.set(id, newQty);
    this.syncStatus.set('saving');
    this.quantityChangeSubject.next();
  }

  private observeDebouncedChanges(): void {
    this.quantityChangeSubject.pipe(
      debounceTime(1000),
      switchMap(() => this.persistPendingChanges().pipe(
        catchError(err => {
          this.syncStatus.set('error');
          this.error.set('Erro na sincronização. Clique em "Tentar Novamente" ou "Desfazer".');
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          this.syncStatus.set('synced');
          this.lastGoodState = [...this.itensLista()];
          this.error.set(null);
        }
      }
    });
  }

  private persistPendingChanges(): Observable<any> {
    const id = this.listaId();
    if (this.pendingItemChanges.size === 0 || !id) return of(null);

    const changes: ItemAlterado[] = [];
    this.pendingItemChanges.forEach((quantidade, id) => changes.push({ id, quantidade }));

    return this.listaCompraService.alterarItens(id, changes).pipe(
      tap(() => this.pendingItemChanges.clear())
    );
  }

  retrySync(): void {
    this.syncStatus.set('saving');
    this.quantityChangeSubject.next();
  }

  rollbackChanges(): void {
    this.itensLista.set([...this.lastGoodState]);
    this.pendingItemChanges.clear();
    this.syncStatus.set('synced');
    this.error.set(null);
  }

  openAddItemsModal(): void {
    const vendorId = this.resolveVendedorId();
    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: {
        vendedorId: vendorId,
        existingItems: this.itensLista(),
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.length) this.addItemsToLista(result);
    });
  }

  private addItemsToLista(itens: { itemOferta: ItemOferta; quantidade: number }[]): void {
    const id = this.listaId();
    if (!id) return;

    this.loading.set(true);
    const payload = itens.map(i => ({ itemOfertaId: i.itemOferta.id, quantidade: i.quantidade }));

    this.listaCompraService.adicionarItensALista(id, payload).subscribe({
      next: () => this.loadListaItems(),
      error: () => this.loading.set(false)
    });
  }

  private resolveVendedorId(): string | null {
    const items = this.itensLista();
    return items.length > 0 ? items[0]?.itemOferta?.vendedor?.id : this.lista()?.vendedor?.id || null;
  }

  toggleSelection(itemId: string): void {
    this.selectedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  }

  clearSelection(): void {
    this.selectedItems.set(new Set());
  }

  removerSelecionados(): void {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        title: 'Remover em Lote', 
        message: `Deseja remover os ${selectedIds.length} itens selecionados?` 
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirm => {
      if (confirm) {
        if (this.pendingItemChanges.size === 0) {
          this.lastGoodState = [...this.itensLista()];
        }

        selectedIds.forEach(id => {
          this.pendingItemChanges.set(id, 0);
        });

        this.itensLista.update(items => items.filter(i => !this.selectedItems().has(i.id!)));
        this.syncStatus.set('saving');
        this.quantityChangeSubject.next();
        this.clearSelection();
      }
    });
  }

  removerItem(itemToRemove: ItemListaModel): void {
    this.updateItemQuantity(itemToRemove.id!, 0);
  }

  saveListMetadata(): void {
    if (this.listaForm.invalid) return;
    
    const currentLista = this.lista();
    if (!this.listaId() || !currentLista) return;

    const request: ListaCompraEdicaoRequest = {
      id: this.listaId()!,
      nome: this.listaForm.get('nome')?.value,
      version: currentLista.version,
    };

    this.loading.set(true);
    this.listaCompraService.atualizarListaCompleta(request).subscribe({
      next: (updated) => {
        this.lista.set(updated);
        this.hasChangesInMeta.set(false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deleteList(): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Excluir Lista', message: 'Deseja excluir esta lista permanentemente?' },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirm => {
      if (confirm && this.listaId()) {
        this.loading.set(true);
        this.listaCompraService.deletarLista(this.listaId()!).subscribe({
          next: () => this.router.navigate(['/home']),
          error: () => this.loading.set(false)
        });
      }
    });
  }

  onAlertClosed(): void {
    this.error.set(null);
  }
}
