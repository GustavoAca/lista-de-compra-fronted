import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router'; // Import Router
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar'; // Import MatToolbarModule
import { MatFormFieldModule } from '@angular/material/form-field'; // For form fields
import { MatInputModule } from '@angular/material/input'; // For input
import { MatAutocompleteModule } from '@angular/material/autocomplete'; // For autocomplete
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms'; // For reactive forms
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For spinner in button

import { Subject, Subscription, Observable, of } from 'rxjs';
import {
  debounceTime,
  switchMap,
  tap,
  expand,
  takeWhile,
  finalize,
  startWith,
  map,
} from 'rxjs/operators';

import { ListaCompraService } from '../../services/lista-compra.service';
import { ListaModel } from '../../models/lista.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ItemAlterado } from '../../models/item-alterado.model';
import { VendedorService } from '../../services/vendedor.service'; // Import VendedorService
import { VendedorModel } from '../../models/vendedor.model'; // Import VendedorModel

import { Page } from '../../../../shared/pipes/page.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';
import { ItemOferta } from '../../models/item-oferta.model';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog/confirmation-dialog.component'; // Import ConfirmationDialogComponent
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';

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
    MatCardModule,
    ItemListDisplayComponent,
    MatToolbarModule, // Use MatToolbarModule
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    FabButtonComponent
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss',
})
export class ListaEditComponent implements OnInit, OnDestroy {
  // =========================
  // Injeções
  // =========================
  private route = inject(ActivatedRoute);
  private router = inject(Router); // Inject Router
  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder); // Inject FormBuilder
  // private vendedorService = inject(VendedorService); // Remove VendedorService injection

  // =========================
  // Estado público (template)
  // =========================
  listaId!: string;
  lista!: ListaModel;
  itensLista: ItemListaModel[] = []; // Renamed from allItems
  totalListaValor = 0;
  loadingInitial = true;
  error: string | null = null; // Renamed from deveExibirMensagem/mensagemErro

  // Form Group
  listaForm!: FormGroup;

  // Vendedor Autocomplete - Removed
  // vendedores$: Observable<Page<VendedorModel>> = of();
  // isVendorSelectionLocked = false;

  // =========================
  // Paginação
  // =========================
  currentPage = 0;

  // =========================
  // Estado interno
  // =========================
  private initialItensState = new Map<string, ItemListaModel>();
  private pendingItemChanges = new Map<string, number>();
  private quantityChangeSubject = new Subject<void>();
  // private searchVendedorSubject = new Subject<string>(); // Removed

  // =========================
  // Subscriptions
  // =========================
  private routeSubscription!: Subscription;
  private debounceSubscription!: Subscription;
  // private searchVendedorSubscription!: Subscription; // Removed

  // =========================
  // Lifecycle
  // =========================
  ngOnInit(): void {
    this.buildForm(); // Build form on init

    this.observeRoute();
    this.observeDebouncedChanges();
    // this.observeVendedorSearch(); // Removed
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.debounceSubscription?.unsubscribe();
    // this.searchVendedorSubscription?.unsubscribe(); // Removed
  }

  // =========================
  // Rota / Inicialização
  // =========================
  private observeRoute(): void {
    this.routeSubscription = this.route.paramMap.subscribe(
      (params: ParamMap) => {
        const id = params.get('id');
        if (!id) {
          this.showError('ID da lista não fornecido.');
          return;
        }

        this.initializeLista(id);
      },
    );
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
      next: (lista) => {
        this.lista = lista;
        this.listaForm.patchValue({
          nome: lista.nome,
          // vendedor: lista.vendedor // Removed vendor patch
        });
        // Remove vendor selection locking and disabling
        // if (lista.vendedor) {
        //   this.isVendorSelectionLocked = true;
        //   this.listaForm.get('vendedor')?.disable();
        // }
        this.listaForm.get('vendedorId')?.setValue(lista.vendedor?.id);

        this.loadListaItems(); // Now triggers full load
      },
      error: (err: any) => {
        this.loadingInitial = false;
        this.showError(err.error?.detail || 'Erro ao carregar a lista.');
      },
    });
  }

  // =========================
  // Form Building
  // =========================
  private buildForm(): void {
    this.listaForm = this.fb.group({
      nome: ['', Validators.required],
      // vendedor: [null, Validators.required], // Removed vendor form control
      vendedorId: ['', Validators.required], // Hidden field to store vendor ID, still required for backend
    });

    // Observe changes in the 'vendedor' control for autocomplete search - Removed
    // this.listaForm.get('vendedor')?.valueChanges
    //   .pipe(
    //     startWith(''),
    //     debounceTime(300),
    //     map(value => typeof value === 'string' ? value : value?.nome),
    //     tap(name => this.searchVendedorSubject.next(name)),
    //   ).subscribe();
  }

  // =========================
  // Itens / Carregamento Completo
  // =========================
  loadListaItems(): void {
    this.loadingInitial = true;
    this.itensLista = []; // Clear previous items
    this.currentPage = 0; // Reset page for full fetch

    this._fetchPage()
      .pipe(
        finalize(() => (this.loadingInitial = false)), // Ensure loading is turned off
      )
      .subscribe({
        next: () => {
          this.onAllItemsLoaded();
          // After items load, set the vendedorId from the first item
          this.listaForm.get('vendedorId')?.setValue(this.resolveVendedorId());
        },
        error: (err: any) => {
          this.showError(
            err.error?.detail || 'Erro ao carregar itens da lista.',
          );
        },
      });
  }

  private _fetchPage(): Observable<Page<ItemListaModel>> {
    return this.listaCompraService
      .getItensPorLista(this.listaId, this.currentPage, 10)
      .pipe(
        tap((page) => {
          this.itensLista.push(...page.content); // Use itensLista
          this.currentPage++;
        }),
        expand((page) => (page.last ? of() : this._fetchPage())),
        takeWhile((page) => !page.last, true), // Include the last page in the result stream
      );
  }

  private onAllItemsLoaded(): void {
    this.initialItensState.clear();
    this.itensLista.forEach(
      (
        item, // Use itensLista
      ) => this.initialItensState.set(item.id!, { ...item }),
    );

    this.calculateTotalValue();
  }

  // =========================
  // Quantidade / Alterações
  // =========================
  incrementarQuantidade(item: ItemListaModel): void {
    item.quantidade++;
    this.registerItemChange(item);
  }

  decrementarQuantidade(item: ItemListaModel): void {
    if (item.quantidade <= 0) {
      // Allow 0 to enable removal
      item.quantidade = 0;
      // Consider removing item from list if quantity goes to 0 here or in removerItem
    }
    this.registerItemChange(item);
  }

  // =========================
  // Item Removal
  // =========================
  removerItem(itemToRemove: ItemListaModel): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja remover o item "${itemToRemove.itemOferta?.item?.nome}" da lista?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingInitial = true; // Set loading
        this.listaCompraService
          .removerItemDaLista(this.listaId, itemToRemove.id!)
          .subscribe({
            next: () => {
              this.itensLista = this.itensLista.filter(
                (item) => item.id !== itemToRemove.id,
              ); // Remove from local array
              this.initialItensState.delete(itemToRemove.id!); // Remove from initial state
              this.pendingItemChanges.delete(itemToRemove.id!); // Remove any pending changes
              this.calculateTotalValue();
              this.loadingInitial = false;
              this.showError('Item removido com sucesso!', 'success'); // Show success message
              // After item removal, update the vendorId in the form if the removed item was the source
              this.listaForm
                .get('vendedorId')
                ?.setValue(this.resolveVendedorId());
            },
            error: (err: any) => {
              this.loadingInitial = false;
              this.showError(
                err.error?.detail || 'Erro ao remover item da lista.',
              );
            },
          });
      }
    });
  }

  private registerItemChange(item: ItemListaModel): void {
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
        switchMap(() => this.persistPendingChanges()),
      )
      .subscribe({
        error: (err: any) =>
          this.showError(
            err.error?.detail || 'Erro ao salvar alterações.',
            'error', // Explicitly set type to error
          ),
      });
  }

  private persistPendingChanges(): Observable<any> {
    if (this.pendingItemChanges.size === 0) {
      return new Observable((observer) => observer.complete());
    }

    const itensAlterados = this.buildItensAlterados();

    return this.listaCompraService
      .alterarItens(this.listaId, itensAlterados)
      .pipe(tap(() => this.onPersistSuccess()));
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
    // Re-initialize initial state with current items after successful save
    this.initialItensState.clear();
    this.itensLista.forEach((item) =>
      this.initialItensState.set(item.id!, { ...item }),
    );
    this.showError('Alterações salvas automaticamente!', 'success'); // Indicate auto-save
  }

  // =========================
  // Modal de adicionar itens
  // =========================
  openAddItemsModal(): void {
    // Get vendor ID from the first item in the list
    const vendedorId = this.resolveVendedorId();

    if (!vendedorId) {
      this.showError(
        'Não foi possível determinar o vendedor para adicionar itens. Adicione um item manualmente ou selecione um vendedor na criação da lista.',
        'error',
      );
      return;
    }

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: {
        vendedorId,
        existingItems: this.itensLista.map((item) => ({
          itemOfertaId: item.itemOferta.id,
          quantidade: item.quantidade,
        })),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || result.length === 0) return;
      this.addItemsToLista(result);
    });
  }

  private addItemsToLista(
    itens: { itemOferta: ItemOferta; quantidade: number }[],
  ): void {
    this.loadingInitial = true;
    const payload = itens.map((i) => ({
      itemOfertaId: i.itemOferta.id,
      quantidade: i.quantidade,
    }));

    this.listaCompraService
      .adicionarItensALista(this.listaId, payload)
      .subscribe({
        next: () => {
          this.pendingItemChanges.clear();
          this.initialItensState.clear();
          this.reloadItens();
          this.loadingInitial = false;
          this.showError('Itens adicionados com sucesso!', 'success');
          // After adding items, re-evaluate the vendorId in the form
          this.listaForm.get('vendedorId')?.setValue(this.resolveVendedorId());
        },
        error: (err: any) => {
          this.loadingInitial = false;
          this.showError(err.error?.detail || 'Erro ao adicionar itens.');
        },
      });
  }

  private resolveVendedorId(): string | null {
    // Prioritize getting vendedorId from the first item in itensLista
    if (
      this.itensLista.length > 0 &&
      this.itensLista[0]?.itemOferta?.vendedor?.id
    ) {
      return this.itensLista[0].itemOferta.vendedor.id;
    }
    // Fallback to the list's vendor if present (though UI is hidden)
    return this.lista?.vendedor?.id || null;
  }

  // =========================
  // Ações de Botões
  // =========================
  goBack(): void {
    this.router.navigate(['/home']);
  }

  deleteList(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmar Exclusão da Lista',
        message: `Tem certeza que deseja excluir a lista "${this.lista?.nome}"? Todos os itens serão perdidos.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingInitial = true; // Set loading state
        this.listaCompraService.deletarLista(this.listaId).subscribe({
          next: () => {
            this.loadingInitial = false;
            this.showError('Lista excluída com sucesso!', 'success');
            this.router.navigate(['/home']); // Navigate back to home after deletion
          },
          error: (err: any) => {
            this.loadingInitial = false;
            this.showError(err.error?.detail || 'Erro ao excluir a lista.');
          },
        });
      }
    });
  }

  saveList(): void {
    this.listaForm.markAllAsTouched(); // Trigger validation
    // Only validate 'nome' as 'vendedorId' might not be directly manageable from UI for existing lists
    if (this.listaForm.get('nome')?.invalid || this.itensLista.length === 0) {
      this.showError('Verifique o nome da lista e adicione itens à lista.', 'error');
      return;
    }

    this.loadingInitial = true; // Set loading state for explicit save

    const updatedLista: ListaModel = {
      ...this.lista, // Keep existing properties
      nome: this.listaForm.get('nome')?.value,
      // vendedor: this.listaForm.get('vendedor')?.value, // Removed vendor update
      // If vendorId is different, update here
      // id: this.listaId, // Ensure ID is passed
      // version: this.lista.version, // Ensure version is passed for optimistic locking
    };

    // First, update the list details (only name now)
    this.listaCompraService.atualizarLista(updatedLista).pipe(
      // Then, if there are pending item quantity changes, persist them
      switchMap(() => this.persistPendingChanges().pipe(
        tap(() => {
          this.loadingInitial = false;
          this.showError('Lista e alterações salvas com sucesso!', 'success');
          // Optionally navigate back or refresh here
          this.router.navigate(['/home']);
        })
      ))
    ).subscribe({
      error: (err: any) => {
        this.loadingInitial = false;
        this.showError(err.error?.detail || 'Erro ao salvar a lista.');
      }
    });
  }

  // =========================
  // Utilitários
  // =========================
  private calculateTotalValue(): void {
    if (this.itensLista.length === 0) {
      this.totalListaValor = 0;
      return;
    }

    this.totalListaValor = this.itensLista.reduce((sum, item) => {
      const preco = item.itemOferta?.preco ?? 0;
      return sum + item.quantidade * preco;
    }, 0);
  }

  private reloadItens(): void {
    this.resetState();
    this.loadListaItems();
  }

  private resetState(): void {
    this.itensLista = []; // Use itensLista
    this.pendingItemChanges.clear();
    this.initialItensState.clear();
    this.clearError();
    this.currentPage = 0;
  }

  trackByItemId(_: number, item: ItemListaModel): string {
    return item.id!;
  }

  // =========================
  // Mensagens
  // =========================
  onAlertClosed(): void {
    this.clearError();
  }

  private showError(
    message: string,
    type: 'error' | 'success' = 'error',
  ): void {
    // Assuming alert-message component can differentiate error/success by 'type' property
    // For now, only using 'error' for general 'error' messages, and 'success' for success.
    // The alert-message component will need to be updated to handle 'success' type if it doesn't already.
    // The current AlertMessageComponent only has 'message' and 'type' is 'error' by default.
    // So, I'll set the error property directly and handle its display in template.
    this.error = message;
    if (type === 'success') {
      // For success messages, we might want to clear them after a short delay
      setTimeout(() => this.clearError(), 3000);
    }
  }

  private clearError(): void {
    this.error = null;
  }
}
