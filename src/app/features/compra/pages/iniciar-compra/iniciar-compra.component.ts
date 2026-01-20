import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of, Subscription, combineLatest, debounceTime, map, startWith, switchMap, tap, expand, takeWhile } from 'rxjs';
import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model'; // Updated import
import { ItemOferta } from '@app/features/lista/models/item-oferta.model';
import { ItemCompra, ListaCompraDetalhada } from '@app/features/compra/models/item-compra.model';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { CompraItemComponent } from '../../components/compra-item/compra-item.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { Page } from '@app/shared/pipes/page.model'; // Import Page

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ItemCompraForm {
  id: string;
  estaNoCarrinho: boolean;
  precoAtual: number;
  emOfertaNaLoja: boolean;
  valorOferta: number | null;
  valorOriginalNaLoja: number | null;
  quantidade: number;
}

@Component({
  selector: 'app-iniciar-compra',
  templateUrl: './iniciar-compra.component.html',
  styleUrls: ['./iniciar-compra.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CompraItemComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ]
})
export class IniciarCompraComponent implements OnInit, OnDestroy {
  shoppingForm: FormGroup;
  itemsFormArray: FormArray;
  listaId: string | null = null;
  listaDetalhes: ListaCompraDetalhada | null = null;
  totalCompra: number = 0;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listaCompraService: ListaCompraService,
    private snackBar: MatSnackBar
  ) {
    this.shoppingForm = this.fb.group({
      items: this.fb.array([]),
    });
    this.itemsFormArray = this.shoppingForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.listaId = this.route.snapshot.paramMap.get('id');
    if (this.listaId) {
      this.loadShoppingList(this.listaId);
    } else {
      this.snackBar.open('ID da lista não fornecido.', 'Fechar', { duration: 3000 });
      this.router.navigate(['/home']);
    }
  }

  loadShoppingList(id: string): void {
    this._fetchListaAndItsItems(id).subscribe(
      ({ lista, itemListaModels }: { lista: ListaModel, itemListaModels: ItemListaModel[] }) => {
        const itensCompra = this._mapToItemCompra(lista, itemListaModels);

        this.listaDetalhes = {
          id: lista.id,
          nome: lista.nome,
          itens: itensCompra
        };
        this.buildForm(this.listaDetalhes.itens);
        this.setupTotalCalculation();
      },
      (error: any) => {
        this.snackBar.open('Erro ao carregar a lista de compras.', 'Fechar', { duration: 3000 });
        console.error('Erro ao carregar lista:', error);
        this.router.navigate(['/home']);
      }
    );
  }

  private _fetchListaAndItsItems(id: string): Observable<{ lista: ListaModel, itemListaModels: ItemListaModel[] }> {
    return this.listaCompraService.getListaById(id).pipe(
      switchMap((lista: ListaModel) => {
        // If lista is null/undefined or has no items, directly return an empty result for items
        if (!lista) {
          return of({ lista, itemListaModels: [] });
        }
        return this._fetchAllItemListaModels(id).pipe(
          map(itemListaModels => ({ lista, itemListaModels }))
        );
      })
    );
  }

  private _mapToItemCompra(lista: ListaModel, itemListaModels: ItemListaModel[]): ItemCompra[] {
    return itemListaModels.map(itemLista => {
      const itemOferta = itemLista.itemOferta;

      return {
        id: itemLista.id,
        listaCompraId: itemLista.listaCompraId,
        itemOferta: itemOferta,
        quantidade: itemLista.quantidade,
        nome: itemOferta.item?.nome || 'Nome Desconhecido',
        // unidadeMedida: itemOferta.item.unidadeMedida || '', // Removed as Item does not have this property
        // observacao: itemOferta.item.observacao || '', // Removed as Item does not have this property
        precoOriginal: itemOferta.preco,

        vendedor: itemOferta.vendedor || { id: '', nome: 'Desconhecido' },
        estaNoCarrinho: false,
        precoAtual: itemOferta.preco,
        emOfertaNaLoja: itemOferta.hasPromocaoAtiva,
        valorOferta: itemOferta.hasPromocaoAtiva ? itemOferta.preco : null,
        valorOriginalNaLoja: itemOferta.preco
      } as ItemCompra;
    });
  }

  // New private method to fetch all items for a given list, handling pagination
  private _fetchAllItemListaModels(listaId: string): Observable<ItemListaModel[]> {
    let allItems: ItemListaModel[] = [];
    let currentPage = 0;

    return this.listaCompraService.getItensPorLista(listaId, currentPage, 10).pipe( // Assuming page size of 10
      tap((page: Page<ItemListaModel>) => {
        allItems = allItems.concat(page.content);
        currentPage++;
      }),
      expand((page: Page<ItemListaModel>) => page.last ? of() : this.listaCompraService.getItensPorLista(listaId, currentPage, 10)),
      takeWhile((page: Page<ItemListaModel>) => !page.last, true), // Include the last page in the result stream
      map(() => allItems) // Once all pages are fetched, emit the accumulated items
    );
  }

  buildForm(items: ItemCompra[]): void {
    items.forEach(item => {
      this.itemsFormArray.push(this.createItemFormGroup(item));
    });
  }

  getItemFormGroup(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup;
  }

  createItemFormGroup(item: ItemCompra): FormGroup {
    return this.fb.group({
      id: [item.id],
      estaNoCarrinho: [item.estaNoCarrinho],
      precoAtual: [item.precoAtual, [Validators.required, Validators.min(0)]],
      emOfertaNaLoja: [item.emOfertaNaLoja],
      valorOferta: [item.valorOferta],
      valorOriginalNaLoja: [item.valorOriginalNaLoja],
      quantidade: [item.quantidade]
    });
  }

  setupTotalCalculation(): void {
    this.subscriptions.add(
      this.itemsFormArray.valueChanges
        .pipe(
          debounceTime(300),
          startWith(this.itemsFormArray.value),
          map((items: ItemCompraForm[]) => this.calculateTotal(items))
        )
        .subscribe(total => {
          this.totalCompra = total;
        })
    );
  }

  calculateTotal(items: ItemCompraForm[]): number {
    return items.reduce((sum, itemForm) => {
      if (itemForm.estaNoCarrinho) {
        const precoUnitario = itemForm.emOfertaNaLoja && itemForm.valorOferta !== null && itemForm.valorOferta > 0
                              ? itemForm.valorOferta
                              : itemForm.precoAtual;
        return sum + (precoUnitario * itemForm.quantidade);
      }
      return sum;
    }, 0);
  }

  trackByItemId(index: number, itemGroup: AbstractControl): string {
    return (itemGroup as FormGroup).get('id')?.value;
  }

  finalizarCompra(): void {
    this.itemsFormArray.markAllAsTouched();

    if (this.shoppingForm.valid) {
      const dadosDaCompra = this.shoppingForm.value.items.filter((item: ItemCompraForm) => item.estaNoCarrinho);
      console.log('Compra finalizada com sucesso!', dadosDaCompra);
      this.snackBar.open('Compra finalizada com sucesso!', 'Fechar', { duration: 3000 });
      this.router.navigate(['/compra/sucesso']);
    } else {
      this.snackBar.open('Verifique os itens do carrinho. Existem campos inválidos.', 'Fechar', { duration: 3000 });
      console.error('Formulário inválido', this.shoppingForm.errors);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
