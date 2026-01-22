import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Observable, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Added MatDialogModule
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ListaCompraService } from '../../services/lista-compra.service';
import { VendedorService } from '../../services/vendedor.service';
import { VendedorModel } from '../../models/vendedor.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ListaCompraCriacao } from '../../models/lista-compra-dto.model';
import { emptyPage, Page } from '@app/shared/pipes/page.model';

import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { AddItemsModalComponent } from '@app/shared/components/add-items-modal/add-items-modal.component';

@Component({
  selector: 'app-lista-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
    MatDialogModule, // Added MatDialogModule
  ],
  templateUrl: './lista-create.component.html',
  styleUrls: ['./lista-create.component.scss'],
})
export class ListaCreateComponent implements OnInit, OnDestroy {
  listaForm: FormGroup;
  vendedores$!: Observable<Page<VendedorModel>>;
  itensLista: ItemListaModel[] = [];

  loading = false;
  error = '';
  totalListaValor = 0;
  totalItens = 0;

  selectedVendorId: string | null = null;
  isVendorSelectionLocked = false;

  private listaCompraService = inject(ListaCompraService);
  private vendedorService = inject(VendedorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder) {
    this.listaForm = this.fb.group({
      nome: ['', Validators.required],
      vendedor: [null],
      vendedorId: [null, Validators.required],
    });
  }

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
      })
    );
  }

  displayVendedor(vendedor?: VendedorModel): string {
    return vendedor ? vendedor.nome : '';
  }

  onVendedorSelecionado(vendedor: VendedorModel): void {
    this.listaForm.patchValue({
      vendedorId: vendedor.id,
    });
    this.selectedVendorId = vendedor.id;
  }

  openAddItemModal(): void {
    if (!this.selectedVendorId) {
      this.snackBar.open(
        'Selecione um vendedor antes de adicionar itens.',
        'Fechar',
        { duration: 3000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '800px',
      data: {
        vendedorId: this.selectedVendorId,
        existingItems: this.itensLista,
      },
    });

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((result: ItemListaModel[] | undefined) => {
        if (!result?.length) return;

        if (!this.isVendorSelectionLocked) {
          this.isVendorSelectionLocked = true;
          this.listaForm.get('vendedor')?.disable();
        }

        result.forEach((newItem) => {
          const existente = this.itensLista.find(
            (i) => i.itemOferta.id === newItem.itemOferta.id
          );

          if (existente) {
            existente.quantidade += newItem.quantidade;
          } else {
            this.itensLista.push({
              tempId: crypto.randomUUID(),
              itemOferta: newItem.itemOferta,
              quantidade: newItem.quantidade,
            });
          }
        });

        this.calcularTotais();
      })
    );
  }

  incrementarQuantidade(item: ItemListaModel): void {
    item.quantidade++;
    this.calcularTotais();
  }

  decrementarQuantidade(item: ItemListaModel): void {
    item.quantidade > 1 ? item.quantidade-- : this.removerItem(item);
    this.calcularTotais();
  }

  removerItem(item: ItemListaModel): void {
    this.itensLista = this.itensLista.filter((i) => i.tempId !== item.tempId);
    this.calcularTotais();

    if (this.itensLista.length === 0) {
      this.isVendorSelectionLocked = false;
      this.selectedVendorId = null;
      this.listaForm.get('vendedor')?.enable();
      this.listaForm.patchValue({ vendedor: null, vendedorId: null });
    }
  }

  private calcularTotais(): void {
    this.totalItens = this.itensLista.reduce((s, i) => s + i.quantidade, 0);
    this.totalListaValor = this.itensLista.reduce(
      (s, i) => s + i.quantidade * i.itemOferta.preco,
      0
    );
  }

  salvarLista(): void {
    this.listaForm.markAllAsTouched();

    if (this.listaForm.invalid || this.itensLista.length === 0) {
      this.snackBar.open(
        'Preencha os campos obrigatórios e adicione itens.',
        'Fechar',
        { duration: 3000 }
      );
      return;
    }

    const payload: ListaCompraCriacao = {
      nome: this.listaForm.get('nome')!.value,
      valorTotal: this.totalListaValor,
      itensLista: this.itensLista.map((i) => ({
        itemOfertaId: i.itemOferta.id!,
        quantidade: i.quantidade,
      })),
    };

    this.loading = true;

    this.listaCompraService.criarLista(payload).subscribe({
      next: () => {
        this.snackBar.open('Lista criada com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Erro ao criar lista.';
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}