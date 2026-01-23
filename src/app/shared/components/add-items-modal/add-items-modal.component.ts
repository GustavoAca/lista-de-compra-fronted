import { Component, OnInit, OnDestroy, Inject, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { VendedorModel } from '../../../features/lista/models/vendedor.model';
import { ItemOferta } from '../../../features/lista/models/item-oferta.model';
import { ItemListaModel } from '../../../features/lista/models/item-lista.model';
import { Page } from '../../pipes/page.model';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InfiniteScrollComponent } from '../infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

import { VendedorService } from '../../../features/lista/services/vendedor.service';
import { ItemOfertaService } from '../../../features/lista/services/item-oferta.service';

/**
 * Dados recebidos pelo MatDialog
 */
export interface AddItemsModalData {
  vendedorId: string | null;
  existingItems: ItemListaModel[];
}

@Component({
  selector: 'app-add-items-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    InfiniteScrollComponent,
    LoadingSpinnerComponent,
    CurrencyPipe,
    MatDialogContent,
    MatDialogActions,
  ],
  templateUrl: './add-items-modal.component.html',
  styleUrls: ['./add-items-modal.component.scss'],
})
export class AddItemsModalComponent implements OnInit, OnDestroy {
  // ===== Injeções =====
  private dialogRef = inject(MatDialogRef<AddItemsModalComponent, ItemListaModel[]>);
  private vendedorService = inject(VendedorService);
  private itemOfertaService = inject(ItemOfertaService);

  // ===== Form Controls =====
  selectedSellerControl = new FormControl<VendedorModel | null>(null);
  itemSearchControl = new FormControl<string>('');

  // ===== Estado de vendedores =====
  sellers: VendedorModel[] = [];
  currentSellerPage = 0;
  isLastSellerPage = false;
  loadingSellers = false;

  // ===== Estado de ofertas =====
  itemOffers: ItemOferta[] = [];
  currentItemOfferPage = 0;
  isLastItemOfferPage = false;
  loadingItemOffers = false;
  readonly pageSize = 10;

  // ===== Seleção de itens =====
  selectedItems = new Map<string, ItemListaModel>();

  // ===== Outras variáveis =====
  errorMessage: string | null = null;
  readonly isDirectSellerMode: boolean;
  readonly vendedorId: string | null;

  // ===== Subscriptions =====
  private sellerSubscription?: Subscription;
  private itemOfferSubscription?: Subscription;
  private sellerValueChangesSubscription?: Subscription;
  private searchValueChangesSubscription?: Subscription;

  constructor(@Inject(MAT_DIALOG_DATA) public data: AddItemsModalData) {
    this.vendedorId = data?.vendedorId ?? null;
    this.isDirectSellerMode = !!this.vendedorId;
  }

  // ===================== LIFECYCLE =====================
  ngOnInit(): void {
    // Preenche itens selecionados existentes
    if (this.data?.existingItems?.length) {
              this.data.existingItems.forEach(item => {
                if (item.itemOferta) { // Add null/undefined check here
                  this.selectedItems.set(item.itemOferta.id, item);
                }
              });    }

    // Modo vendedor direto
    if (this.isDirectSellerMode) {
      this.loadItemOffers(true);
    } else {
      // Modo seleção de vendedor
      this.loadSellers(true);

      this.sellerValueChangesSubscription =
        this.selectedSellerControl.valueChanges.subscribe(seller => {
          if (!seller) {
            this.resetItemOffers(true);
            return;
          }
          this.loadItemOffers(true);
        });
    }

    // Busca por nome
    this.searchValueChangesSubscription =
      this.itemSearchControl.valueChanges
        .pipe(debounceTime(400), distinctUntilChanged())
        .subscribe(() => {
          this.currentItemOfferPage = 0;
          this.isLastItemOfferPage = false;
          this.loadItemOffers(true);
        });
  }

  ngOnDestroy(): void {
    this.sellerSubscription?.unsubscribe();
    this.itemOfferSubscription?.unsubscribe();
    this.sellerValueChangesSubscription?.unsubscribe();
    this.searchValueChangesSubscription?.unsubscribe();
  }

  // ===================== Vendedores =====================
  loadSellers(reset = false): void {
    if (this.isDirectSellerMode) return;

    if (reset) {
      this.currentSellerPage = 0;
      this.isLastSellerPage = false;
      this.sellers = [];
    }

    if (this.loadingSellers || this.isLastSellerPage) return;

    this.loadingSellers = true;
    this.sellerSubscription = this.vendedorService.getVendedores(this.currentSellerPage, this.pageSize)
      .subscribe({
        next: response => {
          this.sellers.push(...response.content);
          this.isLastSellerPage = response.last;
          this.currentSellerPage++;
          this.loadingSellers = false;
        },
        error: err => {
          this.loadingSellers = false;
          this.errorMessage = err.error?.detail || 'Erro ao carregar vendedores.';
        }
      });
  }

  // ===================== Ofertas =====================
  public resolveSellerId(): string | null {
    return this.isDirectSellerMode ? this.vendedorId : this.selectedSellerControl.value?.id ?? null;
  }

  private resetItemOffers(clearSelected = false): void {
    this.itemOffers = [];
    this.currentItemOfferPage = 0;
    this.isLastItemOfferPage = false;
    this.loadingItemOffers = false;

    if (clearSelected) this.selectedItems.clear();
  }

  loadItemOffers(reset = false): void {
    const sellerId = this.resolveSellerId();
    if (!sellerId || this.loadingItemOffers || this.isLastItemOfferPage) return;

    if (reset) this.resetItemOffers(false);

    this.loadingItemOffers = true;
    this.errorMessage = null;

    const search = this.itemSearchControl.value?.trim() ?? '';

    this.itemOfferSubscription = this.itemOfertaService
      .buscarPorVendedorENomeItem(sellerId, search, this.currentItemOfferPage, this.pageSize)
      .subscribe({
        next: page => {
          if (this.currentItemOfferPage === 0) {
            // Substitui a lista
            this.itemOffers = page.content;
          } else {
            // Adiciona para paginação
            this.itemOffers.push(...page.content);
          }

          this.isLastItemOfferPage = page.last;
          this.currentItemOfferPage++;
          this.loadingItemOffers = false;
        },
        error: () => {
          this.errorMessage = 'Erro ao carregar itens';
          this.loadingItemOffers = false;
        }
      });
  }

  // ===================== Quantidade =====================
  getQuantity(itemOferta: ItemOferta): number {
    return this.selectedItems.get(itemOferta.id)?.quantidade ?? 0;
  }

  onQuantityChange(itemOferta: ItemOferta, quantity: number): void {
    if (quantity <= 0) {
      this.selectedItems.delete(itemOferta.id);
      return;
    }

    this.selectedItems.set(itemOferta.id, {
      itemOferta,
      quantidade: quantity,
    });
  }

  incrementQuantity(itemOferta: ItemOferta): void {
    this.onQuantityChange(itemOferta, this.getQuantity(itemOferta) + 1);
  }

  decrementQuantity(itemOferta: ItemOferta): void {
    const current = this.getQuantity(itemOferta);
    if (current > 0) this.onQuantityChange(itemOferta, current - 1);
    else this.selectedItems.delete(itemOferta.id);
  }

  // ===================== Ações =====================
  onConfirm(): void {
    this.dialogRef.close(Array.from(this.selectedItems.values()));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
