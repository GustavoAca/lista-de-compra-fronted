import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListaCompraService } from '../../services/lista-compra.service';
import { Lista } from '../../models/lista.model';
import { ItemListaDTO } from '../../models/item-lista.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { forkJoin, Observable, Subscription } from 'rxjs'; // Import forkJoin and Observable
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lista-edit',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss'
})
export class ListaEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private listaCompraService = inject(ListaCompraService);

  listaId!: string;
  lista!: Lista;
  itens: ItemListaDTO[] = [];
  private initialItensState: Map<string, ItemListaDTO> = new Map(); // Store original state for comparison
  private pendingItemChanges: Map<string, number> = new Map(); // itemId -> newQuantity

  loading = true;
  mensagemErro: string = '';
  deveExibirMensagem = false;
  totalListaValor: number = 0; // New property for total value

  private routeSubscription!: Subscription;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.listaId = params.get('id')!;
      this.loadListaDetails();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadListaDetails(): void {
    this.loading = true;
    this.deveExibirMensagem = false;

    this.listaCompraService.getListaById(this.listaId).subscribe({
      next: (listaResponse) => {
        this.lista = listaResponse;
        this.loadListaItems();
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao carregar detalhes da lista.';
      }
    });
  }

  loadListaItems(): void {
    this.listaCompraService.getItensPorLista(this.listaId, 0, 1000).subscribe({
      next: (pageResponse) => {
        this.itens = pageResponse.content;
        this.initialItensState = new Map(this.itens.map(item => [item.id, { ...item }])); // Deep copy initial state
        this.pendingItemChanges.clear(); // Clear pending changes after loading fresh data
        this.calculateTotalValue(); // Calculate total after loading items
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao carregar itens da lista.';
      }
    });
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }

  incrementarQuantidade(item: ItemListaDTO): void {
    item.quantidade++;
    this.pendingItemChanges.set(item.id, item.quantidade);
    this.calculateTotalValue(); // Update total locally
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    if (item.quantidade > 0) { // Ensure quantity doesn't go below 0 locally
      item.quantidade--;
      this.pendingItemChanges.set(item.id, item.quantidade);
    }

    // If quantity becomes 0, remove it from the displayed items immediately for UX
    if (item.quantidade === 0) {
      this.itens = this.itens.filter(i => i.id !== item.id);
    }
    this.calculateTotalValue(); // Update total locally
  }

  private calculateTotalValue(): void {
    this.totalListaValor = this.itens.reduce((sum, item) => {
      // Ensure item.itemOferta and item.itemOferta.preco are defined before access
      const preco = item.itemOferta && item.itemOferta.preco ? item.itemOferta.preco : 0;
      return sum + (item.quantidade * preco);
    }, 0);
  }

  salvarAlteracoes(): void {
    this.loading = true;
    this.deveExibirMensagem = false;

    const itemsToAdd: { itemOfertaId: string, quantidade: number }[] = [];
    const itemsToRemove: { id: string, quantidade: number }[] = [];

    this.pendingItemChanges.forEach((newQuantity, itemId) => {
      const originalItem = this.initialItensState.get(itemId);
      // If the item was just added (not in initialItensState), consider it an add from 0
      const originalQuantity = originalItem ? originalItem.quantidade : 0;

      const quantityDifference = newQuantity - originalQuantity;

      if (quantityDifference > 0) {
        // Quantity increased, send to adicionar-itens
        const item = this.itens.find(i => i.id === itemId) || originalItem;
        if (item) {
          itemsToAdd.push({ itemOfertaId: item.itemOferta.id, quantidade: quantityDifference });
        }
      } else if (quantityDifference < 0) {
        // Quantity decreased or item fully removed, send to remover-itens
        const item = originalItem || this.itens.find(i => i.id === itemId); // Use original for id
        if (item) {
            itemsToRemove.push({ id: item.id, quantidade: Math.abs(quantityDifference) });
        }
      }
    });

    const observables: Observable<any>[] = [];
    if (itemsToAdd.length > 0) {
      observables.push(this.listaCompraService.adicionarItensALista(this.listaId, itemsToAdd));
    }
    if (itemsToRemove.length > 0) {
      observables.push(this.listaCompraService.removerDaLista(this.listaId, itemsToRemove));
    }

    if (observables.length > 0) {
      forkJoin(observables).subscribe({
        next: () => {
          this.loadListaItems(); // Reload all items to get fresh state from server
        },
        error: (err) => {
          this.loading = false;
          this.deveExibirMensagem = true;
          this.mensagemErro = err.error?.detail || 'Erro ao salvar alterações na lista.';
          // Optionally, handle partial success or revert local changes
        }
      });
    } else {
      this.loading = false;
      // No pending changes, just set loading to false
    }
  }
}

