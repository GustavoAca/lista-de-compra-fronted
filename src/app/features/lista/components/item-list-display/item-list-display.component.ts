import { Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ItemListaModel } from '../../models/item-lista.model';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-item-list-display',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CurrencyPipe, MatCardModule, MatCheckboxModule],
  templateUrl: './item-list-display.component.html',
  styleUrl: './item-list-display.component.scss'
})
export class ItemListDisplayComponent {
  items = input<ItemListaModel[]>([]);
  isEditMode = input<boolean>(false);
  showSelection = input<boolean>(false);
  selectedItems = input<Set<string>>(new Set());
  
  quantityIncrement = output<ItemListaModel>();
  quantityDecrement = output<ItemListaModel>();
  itemRemove = output<ItemListaModel>();
  itemToggle = output<string>();

  isSelected(itemId: string): boolean {
    return this.selectedItems().has(itemId);
  }

  toggle(itemId: string): void {
    this.itemToggle.emit(itemId);
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
}
