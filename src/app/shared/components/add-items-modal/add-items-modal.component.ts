import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { VendedorModel } from '../../../features/lista/models/vendedor.model';
import { ItemOferta } from '../../../features/lista/models/item-oferta.model';
import { ItemListaModel } from '../../../features/lista/models/item-lista.model';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { InfiniteScrollComponent } from '../infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

import { VendedorService } from '../../../features/lista/services/vendedor.service';
import { ItemOfertaService } from '../../../features/lista/services/item-oferta.service';

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
    MatCheckboxModule,
    InfiniteScrollComponent,
    LoadingSpinnerComponent,
    CurrencyPipe,
    MatDialogModule,
  ],
  templateUrl: './add-items-modal.component.html',
  styleUrls: ['./add-items-modal.component.scss'],
})
export class AddItemsModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddItemsModalComponent, ItemListaModel[]>);
  public data = inject<AddItemsModalData>(MAT_DIALOG_DATA);
  private vendedorService = inject(VendedorService);
  private itemOfertaService = inject(ItemOfertaService);
  private destroyRef = inject(DestroyRef);

  // Signals de Estado
  sellers = signal<VendedorModel[]>([]);
  itemOffers = signal<ItemOferta[]>([]);
  selectedItemsMap = signal<Map<string, ItemListaModel>>(new Map());
  
  loadingSellers = signal(false);
  loadingOffers = signal(false);
  isLastOfferPage = signal(false);
  error = signal<string | null>(null);

  // Form Controls reativos
  selectedSellerControl = new FormControl<VendedorModel | null>(null);
  itemSearchControl = new FormControl<string>('');

  // Propriedades Computadas
  isDirectSellerMode = computed(() => !!this.data?.vendedorId);
  currentSellerId = computed(() => this.data?.vendedorId || this.selectedSellerControl.value?.id || null);
  selectedCount = computed(() => this.selectedItemsMap().size);

  private currentPage = 0;
  private readonly pageSize = 10;

  ngOnInit(): void {
    // Inicializar mapa de seleção
    if (this.data?.existingItems?.length) {
      const map = new Map();
      this.data.existingItems.forEach(item => {
        if (item.itemOferta) map.set(item.itemOferta.id, { ...item });
      });
      this.selectedItemsMap.set(map);
    }

    if (this.isDirectSellerMode()) {
      this.loadItemOffers(true);
    } else {
      this.loadSellers();
      this.selectedSellerControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadItemOffers(true));
    }

    this.itemSearchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadItemOffers(true));
  }

  loadSellers(): void {
    if (this.loadingSellers()) return;
    this.loadingSellers.set(true);
    this.vendedorService.getVendedores(0, 100).subscribe({
      next: res => {
        this.sellers.set(res.content);
        this.loadingSellers.set(false);
      },
      error: () => this.loadingSellers.set(false)
    });
  }

  loadItemOffers(reset = false): void {
    const sellerId = this.currentSellerId();
    if (!sellerId || (this.loadingOffers() && !reset)) return;

    if (reset) {
      this.currentPage = 0;
      this.isLastOfferPage.set(false);
      this.itemOffers.set([]);
    }

    if (this.isLastOfferPage()) return;

    this.loadingOffers.set(true);
    const search = this.itemSearchControl.value || '';

    this.itemOfertaService.buscarPorVendedorENomeItem(sellerId, search, this.currentPage, this.pageSize)
      .subscribe({
        next: page => {
          this.itemOffers.update(prev => [...prev, ...page.content]);
          this.isLastOfferPage.set(page.last);
          this.currentPage++;
          this.loadingOffers.set(false);
        },
        error: () => this.loadingOffers.set(false)
      });
  }

  getItemQuantity(id: string): number {
    return this.selectedItemsMap().get(id)?.quantidade ?? 0;
  }

  updateQuantity(itemOferta: ItemOferta, delta: number): void {
    this.selectedItemsMap.update(map => {
      const newMap = new Map(map);
      const current = newMap.get(itemOferta.id);
      const newQty = (current?.quantidade ?? 0) + delta;

      if (newQty <= 0) {
        newMap.delete(itemOferta.id);
      } else {
        newMap.set(itemOferta.id, { itemOferta, quantidade: newQty });
      }
      return newMap;
    });
  }

  onConfirm(): void {
    this.dialogRef.close(Array.from(this.selectedItemsMap().values()));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
