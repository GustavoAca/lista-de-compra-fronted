import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ItemListaModel } from '../../models/item-lista.model';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule

@Component({
  selector: 'app-item-list-display',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CurrencyPipe, MatCardModule], // Added MatCardModule
  templateUrl: './item-list-display.component.html',
  styleUrl: './item-list-display.component.scss'
})
export class ItemListDisplayComponent {
  @Input() items: ItemListaModel[] = [];
  @Output() quantityIncrement = new EventEmitter<ItemListaModel>();
  @Output() quantityDecrement = new EventEmitter<ItemListaModel>();
  @Output() itemRemove = new EventEmitter<ItemListaModel>();
  @Input() isEditMode: boolean = false; // Added isEditMode input

  constructor() { }

  trackByItemId(index: number, item: ItemListaModel): string {
    return item.id!;
  }

  increment(item: ItemListaModel): void {
    this.quantityIncrement.emit(item);
  }

  decrement(item: ItemListaModel): void {
    this.quantityDecrement.emit(item);
  }

  remove(item: ItemListaModel): void {
    this.itemRemove.emit(item);
  }

  // Helper to determine which vendor ID to display
  getVenedorId(item: ItemListaModel): string {
    return item.itemOferta?.vendedor?.nome || 'N/A';
  }
}
