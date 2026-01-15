import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListaCompraService } from '../../services/lista-compra.service';
import { Lista } from '../../models/lista.model';
import { ItemListaDTO } from '../../models/item-lista.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
// Import debounceTime, Subject, switchMap
import { forkJoin, Observable, Subscription, Subject } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators'; // Import operators from 'rxjs/operators'
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
  private initialItensState: Map<string, ItemListaDTO> = new Map();
  private pendingItemChanges: Map<string, number> = new Map();

  loading = true;
  mensagemErro: string = '';
  deveExibirMensagem = false;
  totalListaValor: number = 0;

  private routeSubscription!: Subscription;
  private quantityChangeSubject = new Subject<void>(); // Debounce subject
  private debounceSubscription!: Subscription; // Subscription for debounce

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.listaId = params.get('id')!;
      this.loadListaDetails();
    });

    this.debounceSubscription = this.quantityChangeSubject.pipe(
      debounceTime(3000), // Wait for 3 seconds of inactivity
      tap(() => {
        if (this.pendingItemChanges.size > 0) { // Only show loading if there are changes
          this.loading = true;
          this.deveExibirMensagem = false;
        }
      }),
      switchMap(() => this._processPendingChanges()) // Process changes when debounce finishes
    ).subscribe({
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao salvar alterações na lista.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.debounceSubscription) {
      this.debounceSubscription.unsubscribe();
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
        this.initialItensState = new Map(this.itens.map(item => [item.id, { ...item }]));
        this.pendingItemChanges.clear();
        this.calculateTotalValue();
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
    this.calculateTotalValue();
    this.quantityChangeSubject.next(); // Trigger debounce
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    if (item.quantidade > 0) {
      item.quantidade--;
      this.pendingItemChanges.set(item.id, item.quantidade);
    }

    if (item.quantidade === 0) {
      this.itens = this.itens.filter(i => i.id !== item.id);
    }
    this.calculateTotalValue();
    this.quantityChangeSubject.next(); // Trigger debounce
  }

  private calculateTotalValue(): void {
    this.totalListaValor = this.itens.reduce((sum, item) => {
      const preco = item.itemOferta && item.itemOferta.preco ? item.itemOferta.preco : 0;
      return sum + (item.quantidade * preco);
    }, 0);
  }

  // Renamed salvarAlteracoes to _processPendingChanges and made it private
  private _processPendingChanges(): Observable<any> {
    const itemsToAdd: { itemOfertaId: string, quantidade: number }[] = [];
    const itemsToRemove: { id: string, quantidade: number }[] = [];

    this.pendingItemChanges.forEach((newQuantity, itemId) => {
      const originalItem = this.initialItensState.get(itemId);
      const originalQuantity = originalItem ? originalItem.quantidade : 0;

      const quantityDifference = newQuantity - originalQuantity;

      if (quantityDifference > 0) {
        const item = this.itens.find(i => i.id === itemId) || originalItem;
        if (item) {
          itemsToAdd.push({ itemOfertaId: item.itemOferta.id, quantidade: quantityDifference });
        }
      } else if (quantityDifference < 0) {
        const item = originalItem || this.itens.find(i => i.id === itemId);
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
      return forkJoin(observables).pipe(
        tap({
          next: () => {
            this.loadListaItems(); // Reload all items to get fresh state from server
          },
          error: (err) => {
            this.loading = false;
            this.deveExibirMensagem = true;
            this.mensagemErro = err.error?.detail || 'Erro ao salvar alterações na lista.';
          }
        })
      );
    } else {
      this.loading = false; // No pending changes, just set loading to false
      return new Observable(observer => { // Return an observable even if no changes
        observer.next(undefined);
        observer.complete();
      });
    }
  }
}