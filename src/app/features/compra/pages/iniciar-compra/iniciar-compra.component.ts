import { Component, OnInit, inject, LOCALE_ID, signal, computed, DestroyRef } from '@angular/core';
import { Observable, of, switchMap, map, expand, reduce } from 'rxjs';
import { CommonModule, CurrencyPipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

registerLocaleData(localePt);

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemAlterado } from '@app/features/lista/models/item-alterado.model';
import { ConcluirListaRequestDTO } from '../../models/concluir-lista-request.dto';
import { ItemListaConcluirRequest } from '../../models/item-lista-concluir.model';
import { ItemOferta } from '@app/features/lista/models/item-oferta.model';

import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { AddItemsModalComponent } from '@app/shared/components/add-items-modal/add-items-modal.component';
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';

interface ShoppingItem extends ItemListaModel {
  checked: boolean;
  onSale: boolean;
  price: number;
  name: string;
  unit: string;
  editingPrice: boolean;
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
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FabButtonComponent,
  ],
  providers: [CurrencyPipe, DecimalPipe, { provide: LOCALE_ID, useValue: 'pt' }]
})
export class IniciarCompraComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private listaCompraService = inject(ListaCompraService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // Signals para Gerenciamento de Estado
  listaId = signal<string | null>(null);
  list = signal<ListaModel | null>(null);
  items = signal<ShoppingItem[]>([]);
  loading = signal(true);

  // Signals Computados (Reatividade Automática)
  checkedCount = computed(() => this.items().filter(item => item.checked).length);
  total = computed(() => this.items().reduce((sum, item) => {
    return item.checked ? sum + (item.quantidade * item.price) : sum;
  }, 0));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.snackBar.open('ID da lista não fornecido.', 'Fechar', { duration: 3000 });
      this.router.navigate(['/home']);
      return;
    }
    this.listaId.set(id);
    this.loadShoppingList(id);
  }

  private loadShoppingList(id: string): void {
    this.loading.set(true);
    this.listaCompraService.getListaById(id).pipe(
      switchMap(lista => {
        this.list.set(lista);
        return this.fetchAllItemListaModels(id);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: itens => {
        this.items.set(itens.map(itemLista => ({
          ...itemLista,
          checked: false,
          onSale: itemLista.itemOferta.hasPromocaoAtiva,
          price: itemLista.itemOferta.preco,
          name: itemLista.itemOferta.item?.nome ?? 'Item sem nome',
          unit: 'un',
          editingPrice: false,
        })));
        this.loading.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Erro ao carregar a lista de compras.', 'Fechar', { duration: 3000 });
        this.loading.set(false);
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

  toggleCheck(item: ShoppingItem): void {
    this.items.update(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
  }

  toggleSale(item: ShoppingItem): void {
    this.items.update(prev => prev.map(i => i.id === item.id ? { ...i, onSale: !i.onSale } : i));
  }

  updatePrice(item: ShoppingItem, value: string): void {
    const cleanValue = value.replace(/[^\d,]+/g, '').replace(/\./g, '').replace(',', '.');
    const price = parseFloat(parseFloat(cleanValue || '0').toFixed(2));
    this.items.update(prev => prev.map(i => i.id === item.id ? { ...i, price } : i));
  }

  updateQuantity(item: ShoppingItem, delta: number): void {
    this.items.update(prev => prev.map(i => {
      if (i.id === item.id) {
        const newQuantity = i.quantidade + delta;
        return newQuantity > 0 ? { ...i, quantidade: newQuantity } : i;
      }
      return i;
    }));
  }

  finishShopping(): void {
    const checkedItems = this.items().filter(item => item.checked && item.itemOferta?.id);
    const currentList = this.list();

    if (checkedItems.length === 0 || !currentList) {
      this.snackBar.open('Adicione pelo menos um item ao carrinho', 'OK', { duration: 3000 });
      return;
    }

    const itensConcluir: ItemListaConcluirRequest[] = checkedItems.map(item => ({
      id: item.id!,
      quantidade: item.quantidade,
      version: item.version,
      listaCompraId: currentList.id,
      itemOferta: {
        id: item.itemOferta!.id,
        itemId: item.itemOferta!.item!.id,
        vendedorId: item.itemOferta!.vendedor!.id,
        hasPromocaoAtiva: item.onSale,
        preco: item.price,
        dataInicioPromocao: item.itemOferta?.dataInicioPromocao ? new Date(item.itemOferta.dataInicioPromocao) : undefined,
        dataFinalPromocao: item.itemOferta?.dataFimPromocao ? new Date(item.itemOferta.dataFimPromocao) : undefined,
        version: item.itemOferta?.version,
      }
    }));

    const concluirListaDto: ConcluirListaRequestDTO = {
      id: currentList.id,
      valorTotal: this.total(),
      nome: currentList.nome,
      totalItens: checkedItems.length,
      version: currentList.version,
      itensLista: itensConcluir,
    };

    this.loading.set(true);
    this.listaCompraService.concluirCompra(concluirListaDto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Compra concluída e registrada!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/home']);
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err.error?.detail || 'Erro ao finalizar a compra.', 'Fechar', { duration: 3000 });
      }
    });
  }

  openAddItemsModal(): void {
    const firstItem = this.items().find(i => i.itemOferta?.vendedor?.id);
    const vendedorId = firstItem?.itemOferta?.vendedor?.id;

    if (!vendedorId) {
      this.snackBar.open('Não foi possível determinar o vendedor.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: {
        vendedorId,
        existingItems: this.items().filter(i => i.itemOferta?.id).map(i => ({
          itemOfertaId: i.itemOferta!.id,
          quantidade: i.quantidade,
        })),
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result?.length) this.addItemsToLista(result);
    });
  }

  private addItemsToLista(itens: { itemOferta: ItemOferta; quantidade: number }[]): void {
    const id = this.listaId();
    if (!id) return;

    this.loading.set(true);
    const payload = itens.map(i => ({ itemOfertaId: i.itemOferta.id, quantidade: i.quantidade }));

    this.listaCompraService.adicionarItensALista(id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newItems) => {
        const newShoppingItems: ShoppingItem[] = newItems.map(itemLista => ({
          ...itemLista,
          checked: false,
          onSale: itemLista.itemOferta?.hasPromocaoAtiva ?? false,
          price: itemLista.itemOferta?.preco ?? 0,
          name: itemLista.itemOferta?.item?.nome ?? 'Item sem nome',
          unit: 'un',
          editingPrice: false,
        }));
        this.items.update(prev => [...prev, ...newShoppingItems]);
        this.loading.set(false);
        this.snackBar.open('Itens adicionados!', 'Fechar', { duration: 3000 });
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err.error?.detail || 'Erro ao adicionar itens.', 'Fechar', { duration: 3000 });
      }
    });
  }

  removerItem(itemToRemove: ShoppingItem): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Excluir', message: `Remover "${itemToRemove.name}"?` },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirm => {
      if (confirm && this.listaId()) {
        this.loading.set(true);
        this.listaCompraService.alterarItens(this.listaId()!, [{ id: itemToRemove.id!, quantidade: 0 }]).subscribe({
          next: () => {
            this.items.update(prev => prev.filter(i => i.id !== itemToRemove.id));
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  trackByItemId(index: number, item: ShoppingItem): string {
    return item.id!;
  }
}
