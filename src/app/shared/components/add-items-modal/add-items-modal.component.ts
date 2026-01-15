import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, inject, NgZone, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { VendedorDTO } from '../../../features/lista/models/vendedor.model';
import { ItemOferta } from '../../../features/lista/models/item-oferta.model';
import { Page } from '../../pipes/page.model';import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfiniteScrollComponent } from '../infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { Subscription } from 'rxjs';
import { VendedorService } from '../../../features/lista/services/vendedor.service';
import { ItemOfertaService } from '../../../features/lista/services/item-oferta.service';


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
    MatDialogActions
],
  templateUrl: './add-items-modal.component.html',
  styleUrl: './add-items-modal.component.scss'
})
export class AddItemsModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddItemsModalComponent, { itemOfertaId: string, quantidade: number }[]>);
  private vendedorService = inject(VendedorService);
  private itemOfertaService = inject(ItemOfertaService);

  sellers: VendedorDTO[] = [];
  selectedSellerControl = new FormControl<VendedorDTO | null>(null);
  sellerPage: Page<VendedorDTO> | null = null;
  loadingSellers = false;
  currentSellerPage = 0;
  isLastSellerPage = false;
  isSellerSelected = false;

  itemOffers: ItemOferta[] = []; // Changed to ItemOferta
  itemOfferPage: Page<ItemOferta> | null = null; // Changed to ItemOferta
  loadingItemOffers = false;
  currentItemOfferPage = 0;
  isLastItemOfferPage = false;

  selectedItems: Map<string, { itemOfertaId: string, quantidade: number }> = new Map();
  errorMessage: string | null = null;

  private sellerSubscription!: Subscription;
  private itemOfferSubscription!: Subscription;
  private sellerValueChangesSubscription!: Subscription;

  constructor() {
    // Optionally retrieve data passed to the modal
    // const data = inject(MAT_DIALOG_DATA);
    // this.listaId = data.listaId;
  }

  ngOnInit(): void {
    this.loadSellers(true);
    this.sellerValueChangesSubscription = this.selectedSellerControl.valueChanges.subscribe(seller => {
      if (seller) {
        this.loadItemOffers(true); // Load item offers for the selected seller
      } else {
        this.itemOffers = []; // Clear items if no seller is selected
        this.itemOfferPage = null;
        this.selectedItems.clear(); // Clear selected items when seller changes
      }
    });
  }

  onSelectSellerClick(): void {
    this.loadSellers(true);
  }

  ngOnDestroy(): void {
    this.sellerSubscription?.unsubscribe();
    this.itemOfferSubscription?.unsubscribe();
    this.sellerValueChangesSubscription?.unsubscribe();
  }

  loadSellers(reset: boolean = false): void {
    if (reset) {
      this.currentSellerPage = 0;
      this.isLastSellerPage = false;
      this.sellers = [];
    }

    if (this.isLastSellerPage || this.loadingSellers) {
      return;
    }

    this.loadingSellers = true;
    this.vendedorService.getVendedores(this.currentSellerPage, 10).subscribe({
      next: (response: Page<VendedorDTO>) => {
        this.sellers = [...this.sellers, ...response.content];
        this.isLastSellerPage = response.last;
        this.currentSellerPage++;
        this.loadingSellers = false;
        this.isSellerSelected = true; // Set to true after loading
      },
      error: (err: any) => { // Type added
        this.loadingSellers = false;
        this.errorMessage = err.error?.detail || 'Erro ao carregar vendedores.';
      }
    });
  }
  loadItemOffers(reset: boolean = false): void {
    const sellerId = this.selectedSellerControl.value?.id;
    if (!sellerId) return;

    if (reset) {
      this.currentItemOfferPage = 0;
      this.isLastItemOfferPage = false;
      this.itemOffers = [];
    }

    if (this.isLastItemOfferPage || this.loadingItemOffers) {
      return;
    }

    this.loadingItemOffers = true;
    this.errorMessage = null;

    this.itemOfertaService.getItemOfertasByVendedor(sellerId, this.currentItemOfferPage, 10).subscribe({
      next: (response: Page<ItemOferta>) => { // Changed to ItemOferta
        this.itemOffers = [...this.itemOffers, ...response.content];
        this.isLastItemOfferPage = response.last;
        this.currentItemOfferPage++;
        this.loadingItemOffers = false;
      },
      error: (err: any) => { // Type added
        this.loadingItemOffers = false;
        this.errorMessage = err.error?.detail || 'Erro ao carregar itens do vendedor.';
      }
    });
  }

  onQuantityChange(itemOferta: ItemOferta, quantity: number): void { // Changed to ItemOferta
    if (quantity <= 0) {
      this.selectedItems.delete(itemOferta.id);
    } else {
      this.selectedItems.set(itemOferta.id, { itemOfertaId: itemOferta.id, quantidade: quantity });
    }
  }

  incrementQuantity(itemOferta: ItemOferta): void { // Changed to ItemOferta
    const current = this.getQuantity(itemOferta);
    this.onQuantityChange(itemOferta, current + 1);
  }

  decrementQuantity(itemOferta: ItemOferta): void { // Changed to ItemOferta
    const current = this.getQuantity(itemOferta);
    if (current > 0) {
      this.onQuantityChange(itemOferta, current - 1);
    }
  }

  getQuantity(itemOferta: ItemOferta): number { // Changed to ItemOferta
    return this.selectedItems.get(itemOferta.id)?.quantidade || 0;
  }

  onConfirm(): void {
    // Convert Map to array of objects as expected by adicionarItensALista
    const itemsToReturn = Array.from(this.selectedItems.values());
    this.dialogRef.close(itemsToReturn);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
