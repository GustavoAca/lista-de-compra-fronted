import { Component, inject, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ListaCompraService } from '../../services/lista-compra.service';
import { VendedorService } from '../../services/vendedor.service';
import { ItemOfertaService } from '../../services/item-oferta.service';
import { VendedorModel } from '../../models/vendedor.model';
import { ItemOferta } from '../../models/item-oferta.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ListaCompraCriacao } from '../../models/lista-compra-dto.model';
import { Page } from '@app/shared/pipes/page.model';

import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { HeaderService } from '../../../../core/services/header.service';

@Component({
  selector: 'app-lista-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ItemListDisplayComponent,
    MatAutocompleteModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InfiniteScrollComponent
  ],
  templateUrl: './lista-create.component.html',
  styleUrls: ['./lista-create.component.scss'],
})
export class ListaCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private listaCompraService = inject(ListaCompraService);
  private vendedorService = inject(VendedorService);
  private itemOfertaService = inject(ItemOfertaService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);
  private headerService = inject(HeaderService);
  private destroyRef = inject(DestroyRef);

  // Etapas: 'market' | 'items' | 'finalize'
  currentStep = signal<'market' | 'items' | 'finalize'>('market');
  
  // Form
  listaForm: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    vendedorSearch: [''],
    itemSearch: [''],
    vendedorId: [null, Validators.required],
  });

  // Signals
  selectedVendedor = signal<VendedorModel | null>(null);
  itensLista = signal<Map<string, ItemListaModel>>(new Map());
  itemOffers = signal<ItemOferta[]>([]);
  
  loading = signal(false);
  loadingOffers = signal(false);
  isLastOfferPage = signal(false);
  error = signal<string | null>(null);

  // Observables para busca
  vendedores$!: Observable<Page<VendedorModel>>;
  private currentPageOffers = 0;

  // Signals Computados
  itensArray = computed(() => Array.from(this.itensLista().values()));
  totalItensCount = computed(() => this.itensArray().reduce((s, i) => s + i.quantidade, 0));
  totalListaValor = computed(() => this.itensArray().reduce(
    (s, i) => s + (i.quantidade * i.itemOferta.preco), 0
  ));

  constructor() {
    effect(() => {
      const step = this.currentStep();
      const total = this.totalListaValor();
      const count = this.itensArray().length;
      
      // Atualiza o estado do Header
      this.headerService.updateEditState(
        step === 'finalize' ? 'synced' : 'saving', 
        total, 
        count
      );

      // Define a ação do botão de voltar global (Header)
      if (step === 'items') {
        this.headerService.backAction.set(() => this.voltarParaMercado());
      } else if (step === 'finalize') {
        this.headerService.backAction.set(() => this.currentStep.set('items'));
      } else {
        this.headerService.backAction.set(null); // Comportamento padrão (voltar para home)
      }
    });
  }

  ngOnInit(): void {
    this.configurarBuscaVendedores();
    this.configurarBuscaItens();
  }

  private configurarBuscaVendedores(): void {
    this.vendedores$ = this.listaForm.get('vendedorSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((nome: string) => {
        if (!nome || typeof nome !== 'string' || nome.length < 2) return this.vendedorService.getVendedores();
        return this.vendedorService.searchVendedores(nome, 0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private configurarBuscaItens(): void {
    this.listaForm.get('itemSearch')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadItemOffers(true));
  }

  selecionarVendedor(vendedor: VendedorModel): void {
    this.selectedVendedor.set(vendedor);
    this.listaForm.patchValue({ vendedorId: vendedor.id });
    this.currentStep.set('items');
    this.loadItemOffers(true);
    
    if (!this.listaForm.get('nome')?.value) {
      const data = new Date().toLocaleDateString('pt-BR');
      this.listaForm.patchValue({ nome: `Compra no ${vendedor.nome} - ${data}` });
    }
  }

  loadItemOffers(reset = false): void {
    const sellerId = this.selectedVendedor()?.id;
    if (!sellerId || (this.loadingOffers() && !reset)) return;

    if (reset) {
      this.currentPageOffers = 0;
      this.isLastOfferPage.set(false);
      this.itemOffers.set([]);
    }

    if (this.isLastOfferPage()) return;

    this.loadingOffers.set(true);
    const search = this.listaForm.get('itemSearch')?.value || '';

    this.itemOfertaService.buscarPorVendedorENomeItem(sellerId, search, this.currentPageOffers, 12)
      .subscribe({
        next: page => {
          this.itemOffers.update(prev => [...prev, ...page.content]);
          this.isLastOfferPage.set(page.last);
          this.currentPageOffers++;
          this.loadingOffers.set(false);
        },
        error: () => this.loadingOffers.set(false)
      });
  }

  updateQuantity(itemOferta: ItemOferta, delta: number): void {
    this.itensLista.update(map => {
      const newMap = new Map(map);
      const current = newMap.get(itemOferta.id);
      const newQty = (current?.quantidade ?? 0) + delta;

      if (newQty <= 0) {
        newMap.delete(itemOferta.id);
      } else {
        // Garantimos que o item tenha um 'id' para o track by do template funcionar
        newMap.set(itemOferta.id, { 
          id: itemOferta.id, 
          itemOferta, 
          quantidade: newQty 
        });
      }
      return newMap;
    });
  }

  getItemQuantity(id: string): number {
    return this.itensLista().get(id)?.quantidade ?? 0;
  }

  voltarParaMercado(): void {
    this.currentStep.set('market');
    this.selectedVendedor.set(null);
    this.itensLista.set(new Map());
  }

  avancarParaFinalizar(): void {
    if (this.itensArray().length > 0) {
      this.currentStep.set('finalize');
    } else {
      this.snackBar.open('Adicione pelo menos um item.', 'Fechar', { duration: 3000 });
    }
  }

  salvarLista(): void {
    if (this.listaForm.invalid || this.itensArray().length === 0) return;

    const payload: ListaCompraCriacao = {
      nome: this.listaForm.get('nome')!.value,
      valorTotal: this.totalListaValor(),
      itensLista: this.itensArray().map((i) => ({
        itemOfertaId: i.itemOferta.id!,
        quantidade: i.quantidade,
      })),
    };

    this.loading.set(true);
    this.listaCompraService.criarLista(payload).subscribe({
      next: (newList) => {
        this.snackBar.open('Lista criada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/lista/editar', newList.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Erro ao criar lista.');
      },
    });
  }
}
