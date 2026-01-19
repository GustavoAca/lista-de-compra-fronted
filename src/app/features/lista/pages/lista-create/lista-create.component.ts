import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AddItemsModalComponent } from '../../../../shared/components/add-items-modal/add-items-modal.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { ItemListaDTO } from '../../models/item-lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';
import { ItemOfertaService } from '../../services/item-oferta.service';
import { ListaCompraDTO } from '../../models/lista-compra-dto.model';
import { ItemOferta } from '../../models/item-oferta.model';
import { VendedorDTO } from '../../models/vendedor.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lista-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    CurrencyPipe,
    RouterLink,
    MatCardModule, // Add MatCardModule
  ],
  templateUrl: './lista-create.component.html',
  styleUrl: './lista-create.component.scss',
})
export class ListaCreateComponent implements OnInit, OnDestroy {
  // ===== Injeções =====
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private listaCompraService = inject(ListaCompraService);
  private itemOfertaService = inject(ItemOfertaService);

  // ===== Formulário =====
  listForm!: FormGroup;

  // ===== Estado da Lista =====
  itensLista: ItemListaDTO[] = [];
  loading = false;
  deveExibirMensagem = false;
  mensagemErro: string = '';

  // ===== Subscriptions =====
  private itemOfertaSubscription?: Subscription;
  private createListSubscription?: Subscription;

  // ===== Getters para o template =====
  get totalItens(): number {
    return this.itensLista.reduce((acc, item) => acc + item.quantidade, 0);
  }

  get totalListaValor(): number {
    return this.itensLista.reduce(
      (acc, item) => acc + item.quantidade * item.itemOferta.preco,
      0
    );
  }

  ngOnInit(): void {
    this.listForm = this.fb.group({
      nome: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.itemOfertaSubscription?.unsubscribe();
    this.createListSubscription?.unsubscribe();
  }

  trackByItemId(index: number, item: ItemListaDTO): string {
    return item.itemOferta.id;
  }

  // ============================================================
  // Gerenciamento de Itens
  // ============================================================

  openAddItemsModal(): void {
    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '800px',
      data: { vendedorId: null }, // Pass null to allow seller selection
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result: { itemOfertaId: string; quantidade: number }[]) => {
          if (result && result.length > 0) {
            this.loading = true;
            const itemOfertaIds = result.map((item) => item.itemOfertaId);
            this.itemOfertaService
              .getItensOfertaByIds(itemOfertaIds)
              .subscribe({
                next: (itemOfertas: ItemOferta[]) => {
                  result.forEach((selectedItem) => {
                    const foundOferta = itemOfertas.find(
                      (oferta) => oferta.id === selectedItem.itemOfertaId
                    );
                    if (foundOferta) {
                      const existingItemIndex = this.itensLista.findIndex(
                        (item) => item.itemOferta.id === foundOferta.id
                      );

                      if (existingItemIndex > -1) {
                        // Update existing item quantity
                        this.itensLista[existingItemIndex].quantidade +=
                          selectedItem.quantidade;
                      } else {
                        // Add new item
                        this.itensLista.push({
                          itemOferta: foundOferta,
                          quantidade: selectedItem.quantidade,
                        });
                      }
                    }
                  });
                  this.loading = false;
                },
                error: (err) => {
                  this.loading = false;
                  this.deveExibirMensagem = true;
                  this.mensagemErro =
                    err.error?.detail ||
                    'Erro ao buscar detalhes dos itens de oferta.';
                },
              });
          }
        }
      );
  }

  incrementarQuantidade(item: ItemListaDTO): void {
    item.quantidade++;
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    item.quantidade--;
    if (item.quantidade <= 0) {
      this.removerItem(item);
    }
  }

  removerItem(itemToRemove: ItemListaDTO): void {
    this.itensLista = this.itensLista.filter(
      (item) => item.itemOferta.id !== itemToRemove.itemOferta.id
    );
  }

  // ============================================================
  // Criação da Lista
  // ============================================================

  createList(): void {
    if (this.listForm.invalid) {
      this.listForm.markAllAsTouched();
      return;
    }

    if (this.itensLista.length === 0) {
      this.deveExibirMensagem = true;
      this.mensagemErro = 'A lista deve conter pelo menos um item.';
      return;
    }

    this.loading = true;
    this.deveExibirMensagem = false;

    const listaCompraDTO: ListaCompraDTO = {
      id: undefined, // ID will be generated by the backend
      usuarioId: undefined, // Backend will likely get this from auth context
      nome: this.listForm.get('nome')?.value,
      valorTotal: this.totalListaValor,
      totalItens: this.totalItens,
      itensLista: this.itensLista.map((item) => ({
        itemOferta: item.itemOferta, // Pass the entire ItemOferta object
        quantidade: item.quantidade,
        id: item.id, // Include optional id
        listaCompraId: item.listaCompraId, // Include optional listaCompraId
      })),
    };

    this.createListSubscription = this.listaCompraService
      .criarLista(listaCompraDTO)
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/home']); // Navigate to home or list details
        },
        error: (err) => {
          this.loading = false;
          this.deveExibirMensagem = true;
          this.mensagemErro =
            err.error?.detail || 'Erro ao criar a lista de compras.';
        },
      });
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}