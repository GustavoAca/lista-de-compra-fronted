import { Component, OnInit, OnDestroy, inject, LOCALE_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription, of, switchMap, map, expand, reduce } from 'rxjs';

import { CommonModule, CurrencyPipe, DecimalPipe, registerLocaleData } from '@angular/common'; // Added CurrencyPipe and DecimalPipe
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox'; // New
import { MatChipsModule } from '@angular/material/chips'; // New
import { MatDividerModule } from '@angular/material/divider'; // New
import { MatFormFieldModule } from '@angular/material/form-field'; // New
import { MatInputModule } from '@angular/material/input'; // New
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // New

import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { ListaModel } from '@app/features/lista/models/lista.model';
// import { ShoppingItem } from '../../models/shopping-item.model'; // Removed this import as it's defined here
import { ItemAlterado } from '@app/features/lista/models/item-alterado.model'; // New
import { ConcluirListaRequestDTO } from '../../models/concluir-lista-request.dto'; // New
import { ItemListaConcluirRequest } from '../../models/item-lista-concluir.model'; // New
import { ItemOferta } from '@app/features/lista/models/item-oferta.model'; // New

import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { AddItemsModalComponent } from '@app/shared/components/add-items-modal/add-items-modal.component'; // New
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component'; // New
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog/confirmation-dialog.component'; // New
import { ActivatedRoute, Router } from '@angular/router';

interface ShoppingItem extends ItemListaModel {
  checked: boolean;
  onSale: boolean;
  price: number;
  name: string;
  unit: string;
  editingPrice: boolean; // New property to control price editing
}

@Component({
  selector: 'app-iniciar-compra',
  templateUrl: './iniciar-compra.component.html',
  styleUrls: ['./iniciar-compra.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
    MatCheckboxModule, // New
    MatChipsModule, // New
    MatDividerModule, // New
    MatFormFieldModule, // New
    MatInputModule, // New
    MatDialogModule, // New
    FabButtonComponent, // New
  ],
  providers: [CurrencyPipe, DecimalPipe, { provide: LOCALE_ID, useValue: 'pt' }]
})
export class IniciarCompraComponent implements OnInit, OnDestroy {
  listaId!: string;
  list!: ListaModel; // Renamed from listaDetalhes
  items: ShoppingItem[] = []; // New property
  checkedCount = 0;
  total = 0;
  savings = 0;
  loading = true; // Renamed from loadingInitial

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public router: Router, // Injected as public in constructor
    private listaCompraService: ListaCompraService,
    private snackBar: MatSnackBar,
    private decimalPipe: DecimalPipe,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog, // New: Inject MatDialog
    private cdr: ChangeDetectorRef, // New
    @Inject(LOCALE_ID) private locale: string,
  ) {}

  // =======================
  // Lifecycle
  // =======================

  ngOnInit(): void {
    this.listaId = this.route.snapshot.paramMap.get('id')!; // Use non-null assertion as route is guarded

    if (!this.listaId) {
      // Should not happen if route is correctly configured with a guard
      this.snackBar.open('ID da lista não fornecido.', 'Fechar', { duration: 3000 });
      this.router.navigate(['/home']);
      return;
    }

    this.loadShoppingList(this.listaId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // =======================
  // Data loading
  // =======================

  private loadShoppingList(id: string): void {
    this.loading = true;
    this.listaCompraService.getListaById(id).pipe(
      switchMap(lista => {
        this.list = lista;
        return this.fetchAllItemListaModels(id);
      })
    ).subscribe({
      next: itens => {
        this.items = itens.map(itemLista => ({
          ...itemLista,
          checked: false, // Default to unchecked
          onSale: itemLista.itemOferta.hasPromocaoAtiva,
          price: itemLista.itemOferta.preco,
          name: itemLista.itemOferta.item?.nome ?? 'Item sem nome',
          unit: 'un', // Assuming 'un' if unit is not available
          editingPrice: false, // Initialize editing state
        }));
        this.updateCalculations();
        this.loading = false;
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Erro ao carregar a lista de compras.', 'Fechar', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/home']);
      }
    });
  }

  private fetchAllItemListaModels(listaId: string): Observable<ItemListaModel[]> {
    const pageSize = 10;
    return this.listaCompraService.getItensPorLista(listaId, 0, pageSize).pipe(
      expand(page => page.last ? of() : this.listaCompraService.getItensPorLista(listaId, page.number + 1, pageSize)),
      map(page => page.content),
      reduce((acc, items) => [...acc, ...items], [] as ItemListaModel[])
    );
  }

  // =======================
  // UI Interactions
  // =======================

  toggleCheck(item: ShoppingItem): void {
    item.checked = !item.checked;
    this.updateCalculations();
    // Potentially update backend for item.checked state
    this.updateItemStateInBackend(item);
  }

  toggleSale(item: ShoppingItem): void {
    item.onSale = !item.onSale;
    this.updateCalculations();
    // Potentially update backend for item.onSale state
    this.updateItemStateInBackend(item);
  }

  updatePrice(item: ShoppingItem, value: string): void {
    // Clean the input string: remove currency symbol, replace thousand separators, and change decimal comma to dot
    const cleanValue = value
      .replace(new RegExp(`[^\\d,]+`, 'g'), '') // Remove everything that is not a digit or comma
      .replace(/\./g, '') // Remove thousand separators (dots)
      .replace(',', '.'); // Replace comma with dot for decimal

    let price = parseFloat(cleanValue);

    if (isNaN(price)) {
      price = 0; // Default to 0 if parsing fails
    }

    item.price = parseFloat(price.toFixed(2)); // Ensure two decimal places for precision
    this.updateCalculations();
    this.updateItemStateInBackend(item);
  }

  updateQuantity(item: ShoppingItem, delta: number): void {
    const newQuantity = item.quantidade + delta; // Using item.quantidade as per ItemListaModel
    if (newQuantity > 0) {
      item.quantidade = newQuantity;
      this.updateCalculations();
      this.updateItemStateInBackend(item);
    }
  }

  private updateItemStateInBackend(item: ShoppingItem): void {
    // This is a placeholder for updating the item state (checked, onSale, priceActual, quantity) in the backend.
    // The current backend API (ListaCompraService) has `alterarItens`, which takes `ItemAlterado[]`.
    // I need to map the changes to `ItemAlterado` and send it. This should be debounced.
    // For simplicity, let's just log for now, or use the existing debounce logic from lista-edit if applicable.
    // For now, I'll assume `alterarItens` can handle individual item updates.
    const itemAlterado: ItemAlterado = {
      id: item.id!,
      quantidade: item.quantidade,
      // Additional fields like priceActual, onSale status might need to be part of ItemAlterado
      // or a new DTO for updating shopping status.
      // For now, only quantity is directly supported by ItemAlterado.
    };
    // Implement debounce logic here if multiple item updates are frequent
    // this.listaCompraService.alterarItens(this.listaId, [itemAlterado]).subscribe();
  }


  updateCalculations(): void {
    this.checkedCount = this.items.filter(item => item.checked).length;
    this.total = this.items.reduce((sum, item) => {
      if (!item.checked) return sum;
      return sum + (item.quantidade * item.price);
    }, 0);

    this.savings = 0; // Savings are no longer calculated
  }

  getItemSubtotal(item: ShoppingItem): number {
    return item.quantidade * item.price;
  }

  getItemSavings(item: ShoppingItem): number {
    return 0; // Savings are no longer calculated
  }

  finishShopping(): void {
    let checkedItems = this.items.filter(item => item.checked);

    // Filter out items that do not have valid itemOferta or itemOferta.id
    checkedItems = checkedItems.filter(item => item.itemOferta?.id);

    if (checkedItems.length === 0) {
      this.snackBar.open('Adicione pelo menos um item ao carrinho', 'OK', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.snackBar.open(
      `Compra finalizada! ${checkedItems.length} item(ns) - R$ ${this.total.toFixed(2)}`,
      'OK',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );

    // Adapt to ConcluirListaRequestDTO and call listaCompraService.concluirCompra
    const itensConcluir: ItemListaConcluirRequest[] = checkedItems.map(item => ({
      id: item.id!,
      quantidade: item.quantidade,
      version: item.version,
      listaCompraId: this.list.id, // Added missing property
      itemOferta: { // Map to ItemOfertaConcluirRequest
        id: item.itemOferta!.id, // Non-null assertion after filtering
        itemId: item.itemOferta!.item!.id, // Non-null assertion after filtering
        vendedorId: item.itemOferta!.vendedor!.id, // Non-null assertion after filtering
        hasPromocaoAtiva: item.onSale,
        preco: item.price,
        dataInicioPromocao: item.itemOferta?.dataInicioPromocao ? new Date(item.itemOferta.dataInicioPromocao) : undefined,
        dataFinalPromocao: item.itemOferta?.dataFimPromocao ? new Date(item.itemOferta.dataFimPromocao) : undefined,
        version: item.itemOferta?.version, // Added null check for version
      }
    }));

    const concluirListaDto: ConcluirListaRequestDTO = {
      id: this.list.id,
      valorTotal: this.total,
      nome: this.list.nome,
      totalItens: checkedItems.length,
      version: this.list.version, // Use list version
      itensLista: itensConcluir,
    };

    this.loading = true;
    this.listaCompraService.concluirCompra(concluirListaDto).subscribe({
      next: () => {
        this.snackBar.open('Compra concluída e registrada!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/home']);
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err.error?.detail || 'Erro ao finalizar a compra.', 'Fechar', { duration: 3000 });
      }
    });
  }

  // =======================
  // Modal de adicionar itens
  // =======================
  openAddItemsModal(): void {
    const vendedorId = this.resolveVendedorId();

    if (!vendedorId) {
      this.snackBar.open(
        'Não foi possível determinar o vendedor para adicionar itens.',
        'Fechar',
        { duration: 3000 },
      );
      return;
    }

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: {
        vendedorId,
        existingItems: this.items
          .filter(item => item.itemOferta?.id) // Filter out items without a valid itemOferta.id
          .map((item) => ({
            itemOfertaId: item.itemOferta!.id, // Now it's safe to use non-null assertion
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
    console.log('addItemsToLista: Starting, setting loading to true.');
    this.loading = true;
    const payload = itens.map((i) => ({
      itemOfertaId: i.itemOferta.id,
      quantidade: i.quantidade,
    }));

    console.log('addItemsToLista: Calling service adicionarItensALista.');
    this.listaCompraService
      .adicionarItensALista(this.listaId, payload)
      .subscribe({
        next: (newItemsListaModel: ItemListaModel[]) => {
          console.log('addItemsToLista: Service call succeeded.');
          const newShoppingItems: ShoppingItem[] = newItemsListaModel.map(itemLista => ({
            ...itemLista,
            checked: false, // Default to unchecked
            onSale: itemLista.itemOferta?.hasPromocaoAtiva ?? false, // Added null check
            price: itemLista.itemOferta?.preco ?? 0, // Added null check
            name: itemLista.itemOferta?.item?.nome ?? 'Item sem nome', // Updated null check
            unit: 'un', // Assuming 'un' if unit is not available
            editingPrice: false, // Initialize editing state
          }));
          this.items = [...this.items, ...newShoppingItems]; // Re-assign array to trigger change detection
          this.updateCalculations();
          this.loading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
          this.snackBar.open('Itens adicionados com sucesso!', 'Fechar', { duration: 3000 });
          console.log('addItemsToLista: Loading set to false, UI updated.');
        },
        error: (err: any) => {
          console.error('addItemsToLista: Service call failed.', err);
          this.loading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
          this.snackBar.open(err.error?.detail || 'Erro ao adicionar itens.', 'Fechar', { duration: 3000 });
        },
        complete: () => {
          console.log('addItemsToLista: Subscription completed.');
        }
      });
      console.log('addItemsToLista: Service call initiated, subscription active.');
  }

  private resolveVendedorId(): string | null {
    // Prioritize getting vendedorId from the first item in this.items
    if (
      this.items.length > 0 &&
      this.items[0]?.itemOferta?.vendedor?.id
    ) {
      return this.items[0].itemOferta.vendedor.id;
    }
    // Fallback to the list's vendor if present (though this.list might not have it directly if only items have vendors)
    // In this component, it's safer to rely on existing items for vendor context.
    return null; // If no items, no vendor context
  }

  removerItem(itemToRemove: ShoppingItem): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja remover o item "${itemToRemove.name}" da lista?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true; // Set loading
        var itensAlterados: ItemAlterado[] = [];
        const itemAlterado: ItemAlterado = {
          id: itemToRemove.id,
          quantidade: 0,
        };
        itensAlterados.push(itemAlterado);
        this.listaCompraService
          .alterarItens(this.listaId, itensAlterados)
          .subscribe({
            next: () => {
              this.items = this.items.filter(
                (item) => item.id !== itemToRemove.id,
              ); // Remove from local array
              this.updateCalculations();
              this.loading = false;
              this.snackBar.open('Item removido com sucesso!', 'Fechar', { duration: 3000 });
            },
            error: (err: any) => {
              this.loading = false;
              this.snackBar.open(err.error?.detail || 'Erro ao remover item da lista.', 'Fechar', { duration: 3000 });
            },
          });
      }
    });
  }

  trackByItemId(index: number, item: ShoppingItem): string {
    return item.id!;
  }
}
