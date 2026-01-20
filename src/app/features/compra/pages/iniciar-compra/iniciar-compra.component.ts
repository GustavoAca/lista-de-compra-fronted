import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subscription, combineLatest, debounceTime, map, startWith, switchMap } from 'rxjs'; // Added forkJoin, of, switchMap
import { ListaCompraService } from '@app/features/lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { ItemLista } from '@app/features/lista/models/item.model'; // Import ItemLista
import { ItemOferta } from '@app/features/lista/models/item-oferta.model'; // Import ItemOferta
import { ItemCompra, ListaCompraDetalhada } from '@app/features/compra/models/item-compra.model';
import { ItemOfertaService } from '@app/features/lista/services/item-oferta.service'; // Inject ItemOfertaService
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { CompraItemComponent } from '../../components/compra-item/compra-item.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';

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
    private itemOfertaService: ItemOfertaService, // Inject ItemOfertaService
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
    this.listaCompraService.getListaById(id).pipe(
      switchMap((lista: ListaModel) => {
        if (!lista || !lista.itensLista || lista.itensLista.length === 0) {
          return of({ lista, enrichedItems: [] });
        }

        const itemOfertaObservables = lista.itensLista.map((itemLista: ItemLista) => { // Use ItemLista type here
          if (itemLista.itemOfertaId) {
            return this.itemOfertaService.getItemOfertaById(itemLista.itemOfertaId as string).pipe(
              map(itemOferta => ({ itemLista, itemOferta }))
            );
          } else {
            return of({ itemLista, itemOferta: undefined });
          }
        });
        return forkJoin(itemOfertaObservables).pipe(
          map(results => ({ lista, enrichedItems: results }))
        );
      })
    ).subscribe(
      ({ lista, enrichedItems }) => {
        this.listaDetalhes = {
          id: lista.id,
          nome: lista.nome,
          itens: enrichedItems.map(res => {
            const itemOferta = res.itemOferta;
            const itemLista = res.itemLista;

            if (!itemOferta) {
              return {
                id: itemLista.id,
                listaCompraId: itemLista.listaCompraId,
                itemOferta: {
                  id: itemLista.itemOfertaId as string,
                  dataInicioPromocao: '',
                  dataFimPromocao: '',
                  hasPromocaoAtiva: false,
                  preco: 0,
                  vendedor: { id: '', nome: 'Desconhecido' },
                  item: { id: '', nome: 'Item Desconhecido', isAtivo: false }
                },
                quantidade: itemLista.quantidade,
                nome: 'Item Desconhecido',
                unidadeMedida: '',
                observacao: '',
                precoOriginal: 0,
                vendedor: { id: '', nome: 'Desconhecido' },
                estaNoCarrinho: false,
                precoAtual: 0,
                emOfertaNaLoja: false,
                valorOferta: null,
                valorOriginalNaLoja: null
              } as ItemCompra;
            }

            return {
              id: itemLista.id,
              listaCompraId: itemLista.listaCompraId,
              itemOferta: itemOferta,
              quantidade: itemLista.quantidade,
              nome: itemOferta.item.nome,
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
          })
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
  } // Added missing closing brace for loadShoppingList

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
