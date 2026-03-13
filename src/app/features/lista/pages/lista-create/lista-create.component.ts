import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
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
  filter,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ListaCompraService } from '../../services/lista-compra.service';
import { VendedorService } from '../../services/vendedor.service';
import { VendedorModel } from '../../models/vendedor.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ListaCompraCriacao } from '../../models/lista-compra-dto.model';
import { Page } from '@app/shared/pipes/page.model';

import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { AddItemsModalComponent } from '@app/shared/components/add-items-modal/add-items-modal.component';
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';

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
    MatToolbarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FabButtonComponent
  ],
  templateUrl: './lista-create.component.html',
  styleUrls: ['./lista-create.component.scss'],
})
export class ListaCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private listaCompraService = inject(ListaCompraService);
  private vendedorService = inject(VendedorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // Form
  listaForm: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    vendedor: [null],
    vendedorId: [null, Validators.required],
  });

  // Signals
  itensLista = signal<ItemListaModel[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedVendorId = signal<string | null>(null);
  isVendorSelectionLocked = signal(false);

  // Observables reativos
  vendedores$!: Observable<Page<VendedorModel>>;

  // Signals Computados
  totalItens = computed(() => this.itensLista().reduce((s, i) => s + i.quantidade, 0));
  totalListaValor = computed(() => this.itensLista().reduce(
    (s, i) => s + (i.quantidade * i.itemOferta.preco), 0
  ));

  ngOnInit(): void {
    this.configurarAutocompleteVendedores();
  }

  private configurarAutocompleteVendedores(): void {
    this.vendedores$ = this.listaForm.get('vendedor')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value) => typeof value === 'string' || value === null),
      switchMap((nome: string | null) => {
        if (!nome || nome.length < 2) {
          return this.vendedorService.getVendedores();
        }
        return this.vendedorService.searchVendedores(nome, 0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  displayVendedor(vendedor?: VendedorModel): string {
    return vendedor ? vendedor.nome : '';
  }

  onVendedorSelecionado(vendedor: VendedorModel): void {
    this.listaForm.patchValue({ vendedorId: vendedor.id });
    this.selectedVendorId.set(vendedor.id);
  }

  openAddItemModal(): void {
    const vendorId = this.selectedVendorId();
    if (!vendorId) {
      this.snackBar.open('Selecione um vendedor antes de adicionar itens.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '95vw',
      maxWidth: '800px',
      data: {
        vendedorId: vendorId,
        existingItems: this.itensLista(),
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: ItemListaModel[] | undefined) => {
      if (!result?.length) return;

      if (!this.isVendorSelectionLocked()) {
        this.isVendorSelectionLocked.set(true);
        this.listaForm.get('vendedor')?.disable();
      }

      this.itensLista.update(currentItems => {
        const updated = [...currentItems];
        result.forEach((newItem) => {
          const existente = updated.find(i => i.itemOferta.id === newItem.itemOferta.id);
          if (existente) {
            existente.quantidade += newItem.quantidade;
          } else {
            updated.push({
              tempId: crypto.randomUUID(),
              itemOferta: newItem.itemOferta,
              quantidade: newItem.quantidade,
            });
          }
        });
        return updated;
      });
    });
  }

  incrementarQuantidade(item: ItemListaModel): void {
    this.itensLista.update(items => items.map(i => 
      i.tempId === item.tempId ? { ...i, quantidade: i.quantidade + 1 } : i
    ));
  }

  decrementarQuantidade(item: ItemListaModel): void {
    if (item.quantidade > 1) {
      this.itensLista.update(items => items.map(i => 
        i.tempId === item.tempId ? { ...i, quantidade: i.quantidade - 1 } : i
      ));
    } else {
      this.removerItem(item);
    }
  }

  removerItem(item: ItemListaModel): void {
    this.itensLista.update(items => items.filter(i => i.tempId !== item.tempId));

    if (this.itensLista().length === 0) {
      this.isVendorSelectionLocked.set(false);
      this.selectedVendorId.set(null);
      this.listaForm.get('vendedor')?.enable();
      this.listaForm.patchValue({ vendedor: null, vendedorId: null });
    }
  }

  salvarLista(): void {
    this.listaForm.markAllAsTouched();

    if (this.listaForm.invalid || this.itensLista().length === 0) {
      this.snackBar.open('Preencha os campos obrigatórios e adicione itens.', 'Fechar', { duration: 3000 });
      return;
    }

    const payload: ListaCompraCriacao = {
      nome: this.listaForm.get('nome')!.value,
      valorTotal: this.totalListaValor(),
      itensLista: this.itensLista().map((i) => ({
        itemOfertaId: i.itemOferta.id!,
        quantidade: i.quantidade,
      })),
    };

    this.loading.set(true);
    this.error.set(null);

    this.listaCompraService.criarLista(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Lista criada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Erro ao criar lista.');
      },
    });
  }
}
