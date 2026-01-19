import { ItemListaDTO } from '../../../features/lista/models/item-lista.model';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  inject,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { VendedorDTO } from '../../../features/lista/models/vendedor.model';
import { ItemOferta } from '../../../features/lista/models/item-oferta.model';
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
  styleUrl: './add-items-modal.component.scss',
})
export class AddItemsModalComponent implements OnInit, OnDestroy {
  // ===== Injeções =====
  private dialogRef = inject(
    MatDialogRef<
      AddItemsModalComponent,
      ItemListaDTO[] // Changed return type
    >
  );
  private vendedorService = inject(VendedorService);
  private itemOfertaService = inject(ItemOfertaService);

  // ===== Estado de vendedor =====
  sellers: VendedorDTO[] = [];
  selectedSellerControl = new FormControl<VendedorDTO | null>(null);
  sellerPage: Page<VendedorDTO> | null = null;
  loadingSellers = false;
  currentSellerPage = 0;
  isLastSellerPage = false;

  // ===== Estado de ofertas =====
  itemOffers: ItemOferta[] = [];
  itemOfferPage: Page<ItemOferta> | null = null;
  loadingItemOffers = false;
  currentItemOfferPage = 0;
  isLastItemOfferPage = false;

  // ===== Seleção =====
  selectedItems = new Map<
    string,
    ItemListaDTO // Changed map value type
  >();

  errorMessage: string | null = null;

  // ===== Subscriptions =====
  private sellerSubscription?: Subscription;
  private itemOfferSubscription?: Subscription;
  private sellerValueChangesSubscription?: Subscription;

  // ===== Controle de fluxo =====
  readonly isDirectSellerMode: boolean;
  readonly vendedorId: string | null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddItemsModalData
  ) {
    this.vendedorId = data?.vendedorId ?? null;
    this.isDirectSellerMode = !!this.vendedorId;
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  ngOnInit(): void {
    if (this.isDirectSellerMode) {
      // Fluxo direto: vendedor já definido
      this.loadItemOffers(true);
      return;
    }

    // Fluxo normal: escolher vendedor
    this.loadSellers(true);

    this.sellerValueChangesSubscription =
      this.selectedSellerControl.valueChanges.subscribe((seller) => {
        if (!seller) {
          this.resetItemOffers();
          return;
        }

        this.loadItemOffers(true);
      });
  }

  ngOnDestroy(): void {
    this.sellerSubscription?.unsubscribe();
    this.itemOfferSubscription?.unsubscribe();
    this.sellerValueChangesSubscription?.unsubscribe();
  }

  // ============================================================
  // Vendedores
  // ============================================================

  loadSellers(reset = false): void {
    if (this.isDirectSellerMode) return;

    if (reset) {
      this.currentSellerPage = 0;
      this.isLastSellerPage = false;
      this.sellers = [];
    }

    if (this.loadingSellers || this.isLastSellerPage) return;

    this.loadingSellers = true;

    this.sellerSubscription = this.vendedorService
      .getVendedores(this.currentSellerPage, 10)
      .subscribe({
        next: (response) => {
          this.sellers.push(...response.content);
          this.isLastSellerPage = response.last;
          this.currentSellerPage++;
          this.loadingSellers = false;
        },
        error: (err) => {
          this.loadingSellers = false;
          this.errorMessage =
            err.error?.detail || 'Erro ao carregar vendedores.';
        },
      });
  }

  // ============================================================
  // Ofertas
  // ============================================================

  public resolveSellerId(): string | null {
    return this.isDirectSellerMode
      ? this.vendedorId
      : this.selectedSellerControl.value?.id ?? null;
  }

  loadItemOffers(reset = false): void {
    const sellerId = this.resolveSellerId();
    if (!sellerId) return;

    if (reset) {
      this.currentItemOfferPage = 0;
      this.isLastItemOfferPage = false;
      this.itemOffers = [];
      this.selectedItems.clear();
    }

    if (this.loadingItemOffers || this.isLastItemOfferPage) return;

    this.loadingItemOffers = true;
    this.errorMessage = null;

    this.itemOfferSubscription = this.itemOfertaService
      .getItemOfertasByVendedor(sellerId, this.currentItemOfferPage, 10)
      .subscribe({
        next: (response) => {
          this.itemOffers.push(...response.content);
          this.isLastItemOfferPage = response.last;
          this.currentItemOfferPage++;
          this.loadingItemOffers = false;
        },
        error: (err) => {
          this.loadingItemOffers = false;
          this.errorMessage =
            err.error?.detail || 'Erro ao carregar itens do vendedor.';
        },
      });
  }

  private resetItemOffers(): void {
    this.itemOffers = [];
    this.itemOfferPage = null;
    this.currentItemOfferPage = 0;
    this.isLastItemOfferPage = false;
    this.selectedItems.clear();
  }

  // ============================================================
  // Quantidade
  // ============================================================

  getQuantity(itemOferta: ItemOferta): number {
    return this.selectedItems.get(itemOferta.id)?.quantidade ?? 0;
  }

  onQuantityChange(itemOferta: ItemOferta, quantity: number): void {
    if (quantity <= 0) {
      this.selectedItems.delete(itemOferta.id);
      return;
    }

    this.selectedItems.set(itemOferta.id, {
      itemOferta: itemOferta, // Store the full object
      quantidade: quantity,
    });
  }

  incrementQuantity(itemOferta: ItemOferta): void {
    this.onQuantityChange(itemOferta, this.getQuantity(itemOferta) + 1);
  }

  decrementQuantity(itemOferta: ItemOferta): void {
    const current = this.getQuantity(itemOferta);
    if (current > 0) {
      this.onQuantityChange(itemOferta, current - 1);
    }
  }

  // ============================================================
  // Ações
  // ============================================================

  onConfirm(): void {
    this.dialogRef.close(Array.from(this.selectedItems.values()));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
