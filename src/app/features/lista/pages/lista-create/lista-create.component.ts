import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; // Import RouterLink

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

import { ListaCompraService } from '../../services/lista-compra.service';
import { AddItemsModalComponent } from '@app/shared/components/add-items-modal/add-items-modal.component';
import { VendedorService } from '../../services/vendedor.service';
import { VendedorModel } from '../../models/vendedor.model';
import { ItemListaModel } from '../../models/item-lista.model';
import { ItemOferta } from '../../models/item-oferta.model';
import { ListaCompraCriacao } from '../../models/lista-compra-dto.model';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Import CurrencyPipe
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component'; // Import
import { AlertMessageComponent } from '@app/shared/components/alert-message/alert-message.component'; // Import
import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component'; // Import
import { Page } from '@app/shared/pipes/page.model'; // Added import for Page

@Component({
  selector: 'app-lista-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LoadingSpinnerComponent, // Added
    AlertMessageComponent, // Added
    ItemListDisplayComponent, // Added
    RouterLink, // Added
    CurrencyPipe, // Added
  ],
  templateUrl: './lista-create.component.html',
  styleUrls: ['./lista-create.component.scss'],
})
export class ListaCreateComponent implements OnInit, OnDestroy {
  listaForm: FormGroup;
  vendedores$!: Observable<Page<VendedorModel>>;
  itensLista: ItemListaModel[] = [];

  loading: boolean = false;
  deveExibirMensagem: boolean = false;
  mensagemErro: string = '';
  totalListaValor: number = 0;
  totalItens: number = 0;

  selectedVendorId: string | null = null; // New property
  isVendorSelectionLocked: boolean = false; // New property

  private listaCompraService = inject(ListaCompraService);
  private vendedorService = inject(VendedorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder) {
    this.listaForm = this.fb.group({
      nome: ['', Validators.required],
      vendedorId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.vendedores$ = this.vendedorService.getVendedores();

    // Subscribe to vendorId changes to update selectedVendorId if not locked
    this.subscriptions.add(
      this.listaForm.get('vendedorId')?.valueChanges.subscribe((vendorId) => {
        if (!this.isVendorSelectionLocked) {
          this.selectedVendorId = vendorId;
        }
      }),
    );
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }

  openAddItemModal(): void {

  if (!this.selectedVendorId) {
    this.snackBar.open(
      'Por favor, selecione um vendedor antes de adicionar itens.',
      'Fechar',
      { duration: 3000 }
    );
    return;
  }

  const dialogRef = this.dialog.open(AddItemsModalComponent, {
    width: '800px',
    data: {
      vendedorId: this.selectedVendorId,
      existingItems: this.itensLista
    }
  });

  this.subscriptions.add(
    dialogRef.afterClosed().subscribe((result: ItemListaModel[] | undefined) => {
      if (!result || result.length === 0) return;

      // trava o vendedor na primeira inclusão
      if (!this.isVendorSelectionLocked) {
        this.isVendorSelectionLocked = true;
        this.listaForm.get('vendedorId')?.disable();
      }

      result.forEach(newItem => {
        const index = this.itensLista.findIndex(
          item => item.itemOferta.id === newItem.itemOferta.id
        );

        if (index > -1) {
          this.itensLista[index].quantidade += newItem.quantidade;
        } else {
          this.itensLista.push({
            tempId: crypto.randomUUID(),
            itemOferta: newItem.itemOferta,
            quantidade: newItem.quantidade
          });
        }
      });

      this.calculateTotals();
    })
  );
}


  incrementarQuantidade(item: ItemListaModel): void {
    item.quantidade++;
    this.calculateTotals();
  }

  decrementarQuantidade(item: ItemListaModel): void {
    if (item.quantidade > 1) {
      item.quantidade--;
      this.calculateTotals();
    } else {
      this.removerItem(item);
    }
  }

  removerItem(itemToRemove: ItemListaModel): void {
    this.itensLista = this.itensLista.filter(
      (item) => item.tempId !== itemToRemove.tempId,
    );
    this.calculateTotals();

    // Unlock vendor selection if all items are removed
    if (this.itensLista.length === 0) {
      this.selectedVendorId = null;
      this.isVendorSelectionLocked = false;
      this.listaForm.get('vendedorId')?.enable(); // Re-enable the control
      this.listaForm.get('vendedorId')?.setValue(''); // Clear selected value
    }
  }

  private calculateTotals(): void {
    this.totalItens = this.itensLista.reduce(
      (sum, item) => sum + item.quantidade,
      0,
    );
    this.totalListaValor = this.itensLista.reduce(
      (sum, item) => sum + item.quantidade * (item.itemOferta?.preco || 0),
      0,
    );
  }

  salvarLista(): void {
    this.listaForm.markAllAsTouched();
    // Re-enable vendorId temporarily for validation check
    const formValue = this.listaForm.getRawValue();

    if (
      !formValue.nome ||
      !this.selectedVendorId ||
      this.itensLista.length === 0
    ) {
      this.snackBar.open(
        'Preencha todos os campos obrigatórios e adicione pelo menos um item à lista.',
        'Fechar',
        { duration: 3000 },
      );
      return;
    }
    const listaCompraCriacao: ListaCompraCriacao = {
      nome: this.listaForm.get('nome')?.value,
      valorTotal: 0.0,
      itensLista: this.itensLista.map((item) => ({
        itemOfertaId: item.itemOferta.id!,
        quantidade: item.quantidade,
      })),
    };

    this.loading = true;
    this.listaCompraService.criarLista(listaCompraCriacao).subscribe(
      () => {
        this.snackBar.open('Lista criada com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/home']);
      },
      (error) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro =
          error.error?.detail || 'Erro ao criar lista. Tente novamente.';
        this.snackBar.open(this.mensagemErro, 'Fechar', { duration: 3000 });
        console.error('Erro ao criar lista:', error);
      },
    );
  }

  private getCurrentVendorId(): string | null {
    if (this.itensLista.length > 0) {
      return this.itensLista[0].itemOferta.vendedor.id;
    }
    return this.selectedVendorId;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
