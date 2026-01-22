import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Observable,
  Subscription,
  of,
  switchMap,
  map,
  expand,
  reduce,
  debounceTime,
  startWith,
} from 'rxjs';

import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ItemListaModel } from '@app/features/lista/models/item-lista.model';
import {
  ItemCompra,
  ListaCompraDetalhada,
} from '@app/features/compra/models/item-compra.model';

import { CompraItemComponent } from '../../components/compra-item/compra-item.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { ConcluirListaRequestDTO } from '../../models/concluir-lista-request.dto';
import { ItemListaConcluirRequest } from '../../models/item-lista-concluir.model';
import { ItemOfertaConcluirRequest } from '../../models/item-oferta-concluir.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ListaModel } from '@app/features/lista/models/lista.model';

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
    LoadingSpinnerComponent,
  ],
})
export class IniciarCompraComponent implements OnInit, OnDestroy {
  shoppingForm: FormGroup;
  itemsFormArray: FormArray;
  listaId: string | null = null;
  listaDetalhes: ListaCompraDetalhada | null = null;
  totalCompra = 0;
  listaVersion: number = 0;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listaCompraService: ListaCompraService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.shoppingForm = this.fb.group({
      items: this.fb.array([]),
    });

    this.itemsFormArray = this.shoppingForm.get('items') as FormArray;
  }

  // =======================
  // Lifecycle
  // =======================

  ngOnInit(): void {
    this.listaId = this.route.snapshot.paramMap.get('id');

    if (!this.listaId) {
      this.handleError('ID da lista não fornecido.');
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
    this.fetchListaAndItems(id).subscribe({
      next: ({ lista, itens }) => {
        const itensCompra = this.mapToItemCompra(itens);
        this.listaDetalhes = { // listaVersion removed, will use lista.version directly
          id: lista.id,
          nome: lista.nome, // Changed nome to name
          itens: itensCompra,
        };
        this.listaVersion = lista.version || 0; // Set listaVersion

        this.buildForm(itensCompra);
        this.setupTotalCalculation();
      },
      error: (err) =>
        this.handleError('Erro ao carregar a lista de compras.', err),
    });
  }

  private fetchListaAndItems(
    listaId: string,
  ): Observable<{ lista: ListaModel; itens: ItemListaModel[] }> { // Changed ListaModel to ShoppingList
    return this.listaCompraService
      .getListaById(listaId)
      .pipe(
        switchMap((lista) =>
          this.fetchAllItemListaModels(listaId).pipe(
            map((itens) => ({ lista, itens })),
          ),
        ),
      );
  }

  private fetchAllItemListaModels(
    listaId: string,
  ): Observable<ItemListaModel[]> {
    const pageSize = 10;

    return this.listaCompraService.getItensPorLista(listaId, 0, pageSize).pipe(
      expand((page) =>
        page.last
          ? of()
          : this.listaCompraService.getItensPorLista(
              listaId,
              page.number + 1,
              pageSize,
            ),
      ),
      map((page) => page.content),
      reduce((acc, items) => [...acc, ...items], [] as ItemListaModel[]),
    );
  }

  // =======================
  // Mapping
  // =======================

  private mapToItemCompra(itens: ItemListaModel[]): ItemCompra[] {
    return itens.map((itemLista) => {
      const oferta = itemLista.itemOferta;

      return {
        id: itemLista.id,
        listaCompraId: itemLista.listaCompraId,
        itemOferta: oferta,
        quantidade: itemLista.quantidade,
        nome: oferta.item?.nome ?? 'Nome não informado',
        precoOriginal: oferta.preco,
        vendedor: oferta.vendedor ?? { id: '', nome: 'Desconhecido' },
        estaNoCarrinho: false,
        precoAtual: oferta.preco,
        emOfertaNaLoja: oferta.hasPromocaoAtiva,
        valorOferta: oferta.hasPromocaoAtiva ? oferta.preco : null,
        valorOriginalNaLoja: oferta.preco,
        version: itemLista.version,
      } as ItemCompra;
    });
  }

  // =======================
  // Form
  // =======================

  private buildForm(items: ItemCompra[]): void {
    this.itemsFormArray.clear();

    items.forEach((item) => {
      this.itemsFormArray.push(this.createItemFormGroup(item));
    });

    // 🔴 ESSENCIAL PARA A RENDERIZAÇÃO
    this.itemsFormArray.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  private createItemFormGroup(item: ItemCompra): FormGroup {
    return this.fb.group({
      id: [item.id],
      estaNoCarrinho: [item.estaNoCarrinho],
      precoAtual: [item.precoAtual, [Validators.required, Validators.min(0)]],
      emOfertaNaLoja: [item.emOfertaNaLoja],
      valorOferta: [item.valorOferta],
      valorOriginalNaLoja: [item.valorOriginalNaLoja],
      quantidade: [item.quantidade, [Validators.required, Validators.min(1)]],
    });
  }

  getItemFormGroup(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup;
  }

  trackByItemId(index: number, control: AbstractControl): string {
    return control.get('id')?.value;
  }

  // =======================
  // Total calculation
  // =======================

  private setupTotalCalculation(): void {
    this.subscriptions.add(
      this.itemsFormArray.valueChanges
        .pipe(
          debounceTime(300),
          startWith(this.itemsFormArray.value),
          map((items) => this.calculateTotal(items)),
        )
        .subscribe((total) => (this.totalCompra = total)),
    );
  }

  private calculateTotal(items: ItemCompraForm[]): number {
    return items.reduce((total, item) => {
      if (!item.estaNoCarrinho) return total;

      const precoUnitario =
        item.emOfertaNaLoja && item.valorOferta
          ? item.valorOferta
          : item.precoAtual;

      return total + precoUnitario * item.quantidade;
    }, 0);
  }

  // =======================
  // Actions
  // =======================

  concluirCompra(): void {
    this.itemsFormArray.markAllAsTouched();

    if (!this.shoppingForm.valid) {
      this.snackBar.open('Existem itens inválidos no carrinho.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (!this.listaDetalhes) {
      this.snackBar.open(
        'Não foi possível recuperar os detalhes da lista.',
        'Fechar',
        { duration: 3000 },
      );
      return;
    }

    const formItems = this.shoppingForm.value.items;

    const itensLista: ItemListaConcluirRequest[] = this.listaDetalhes.itens
      .map((itemOriginal, index) => {
        const formItem = formItems[index];
        if (!formItem.estaNoCarrinho) return null;

        const itemOferta: ItemOfertaConcluirRequest = {
          id: itemOriginal.itemOferta.id,
          itemId: itemOriginal.itemOferta.item.id,
          vendedorId: itemOriginal.itemOferta.vendedor.id,
          hasPromocaoAtiva: formItem.emOfertaNaLoja,
          preco: formItem.precoAtual,
          dataInicioPromocao: itemOriginal.itemOferta.dataInicioPromocao
            ? new Date(itemOriginal.itemOferta.dataInicioPromocao)
            : undefined,
          dataFinalPromocao: itemOriginal.itemOferta.dataFimPromocao
            ? new Date(itemOriginal.itemOferta.dataFimPromocao)
            : undefined,
          version: itemOriginal.itemOferta.version,
        };

        return {
          id: itemOriginal.id,
          quantidade: formItem.quantidade,
          version: itemOriginal.version,
          itemOferta: itemOferta,
          listaCompraId: itemOriginal.listaCompraId!,
        };
      })
      .filter((item): item is ItemListaConcluirRequest => item !== null);

    const concluirListaDto: ConcluirListaRequestDTO = {
      id: this.listaDetalhes.id,
      valorTotal: this.totalCompra,
      nome: this.listaDetalhes.nome, // Changed nome to name
      totalItens: itensLista.length,
      version: this.listaVersion,
      itensLista: itensLista,
    };
    console.table(concluirListaDto);

    this.subscriptions.add(
      this.listaCompraService.concluirCompra(concluirListaDto).subscribe({
        next: () => {
          this.snackBar.open('Compra concluída com sucesso!', 'Fechar', {
            duration: 3000,
          });
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.handleError('Erro ao concluir a compra.', err);
        },
      }),
    );
  }

  // =======================
  // Utils
  // =======================

  private handleError(message: string, error?: any): void {
    console.error(message, error);
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  }
}
