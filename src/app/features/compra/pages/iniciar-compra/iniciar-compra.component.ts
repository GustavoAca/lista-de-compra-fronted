import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Observable, Subscription, of, switchMap, map, expand, reduce } from 'rxjs';

import { CommonModule, CurrencyPipe } from '@angular/common'; // Added CurrencyPipe
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

import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemOferta } from '@app/features/lista/models/item-oferta.model'; // New
import { ShoppingItem } from '../../models/shopping-item.model'; // New
import { ItemAlterado } from '@app/features/lista/models/item-alterado.model'; // New
import { ConcluirListaRequestDTO } from '../../models/concluir-lista-request.dto'; // New
import { ItemListaConcluirRequest } from '../../models/item-lista-concluir.model'; // New

import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { ActivatedRoute, Router } from '@angular/router';

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
  ],
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
          priceActual: itemLista.itemOferta.preco,
          priceEstimated: itemLista.itemOferta.preco,
          name: itemLista.itemOferta.item?.nome ?? 'Item sem nome',
          unit: 'un', // Assuming 'un' if unit is not available
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
    if (!item.onSale) {
      item.priceActual = item.priceEstimated;
    }
    this.updateCalculations();
    // Potentially update backend for item.onSale state
    this.updateItemStateInBackend(item);
  }

  updatePrice(item: ShoppingItem, value: string): void {
    const price = parseFloat(value) || 0;
    item.priceActual = price;
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
      const price = item.onSale ? item.priceActual : item.priceEstimated;
      return sum + (item.quantidade * price);
    }, 0);

    this.savings = this.items.reduce((sum, item) => {
      if (!item.checked || !item.onSale || item.priceActual >= item.priceEstimated) return sum;
      return sum + (item.quantidade * (item.priceEstimated - item.priceActual));
    }, 0);
  }

  getItemSubtotal(item: ShoppingItem): number {
    const price = item.onSale ? item.priceActual : item.priceEstimated;
    return item.quantidade * price;
  }

  getItemSavings(item: ShoppingItem): number {
    if (item.onSale && item.priceActual < item.priceEstimated) {
      return item.quantidade * (item.priceEstimated - item.priceActual);
    }
    return 0;
  }

  finishShopping(): void {
    const checkedItems = this.items.filter(item => item.checked);

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
        id: item.itemOferta.id,
        itemId: item.itemOferta.item!.id,
        vendedorId: item.itemOferta.vendedor!.id,
        hasPromocaoAtiva: item.onSale,
        preco: item.priceActual,
        dataInicioPromocao: item.itemOferta.dataInicioPromocao ? new Date(item.itemOferta.dataInicioPromocao) : undefined,
        dataFinalPromocao: item.itemOferta.dataFimPromocao ? new Date(item.itemOferta.dataFimPromocao) : undefined,
        version: item.itemOferta.version,
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
        this.snackBar.open(err.error?.detail || 'Erro ao finalizar a compra.', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // =======================
  // Utils (Removed handleError, using snackbar directly)
  // =======================
}
