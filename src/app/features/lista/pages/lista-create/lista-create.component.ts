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
import { ItemListDisplayComponent } from '../../components/item-list-display/item-list-display.component';
import { VendedorDTO } from '../../models/vendedor.model';
import { Subscription } from 'rxjs';
import { ListaCompraCriacao } from '../../models/item-oferta-reduzido.model';

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
    MatCardModule,
    ItemListDisplayComponent, // Add the new component here
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
      0,
    );
  }

  ngOnInit(): void {
    this.listForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnDestroy(): void {
    this.itemOfertaSubscription?.unsubscribe();
    this.createListSubscription?.unsubscribe();
  }

  // trackByItemId is removed from here

  // ============================================================
  // Gerenciamento de Itens
  // ============================================================

  adicionarItem(oferta: ItemOferta) {
    this.itensLista.push({
      tempId: crypto.randomUUID(), // ou Date.now() + Math.random()
      quantidade: 1,
      itemOferta: oferta,
    });
  }

  openAddItemsModal(): void {
    this.loading = true; // Set loading to true when modal opens
    const dialogRef = this.dialog.open(AddItemsModalComponent, {
      width: '800px',
      data: { vendedorId: null }, // Pass null to allow seller selection
    });

    dialogRef.afterClosed().subscribe((result: ItemListaDTO[] | undefined) => {
      if (result?.length) {
        result.forEach((newItem) => {
          const normalized: ItemListaDTO = {
            tempId: crypto.randomUUID(),
            quantidade: newItem.quantidade ?? 1,
            itemOferta: {
              ...newItem.itemOferta,
              item: newItem.itemOferta.item, // GARANTIR que existe
            },
          };

          const index = this.itensLista.findIndex(
            (i) => i.itemOferta.id === normalized.itemOferta.id,
          );

          if (index > -1) {
            this.itensLista[index].quantidade += normalized.quantidade;
          } else {
            this.itensLista.push(normalized);
          }
        });

        this.itensLista = [...this.itensLista];
      }
      this.loading = false;
    });
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
      (item) => item.tempId !== itemToRemove.tempId,
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

    const listaCompraDTO: ListaCompraCriacao = {
      id: undefined, // ID will be generated by the backend
      usuarioId: undefined, // Backend will likely get this from auth context
      nome: this.listForm.get('nome')?.value,
      valorTotal: this.totalListaValor,
      totalItens: this.totalItens,
      itensLista: this.itensLista.map((item) => ({
        itemOfertaId: item.itemOferta.id,
        quantidade: item.quantidade,
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

  receberVendedor(): string | null {
    return null; // In create mode, no specific seller is selected
  }
}
