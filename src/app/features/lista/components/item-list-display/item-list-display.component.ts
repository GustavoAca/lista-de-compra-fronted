import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ItemListaDTO } from '../../models/item-lista.model';

@Component({
  selector: 'app-item-list-display',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './item-list-display.component.html',
  styleUrl: './item-list-display.component.scss',
})
export class ItemListDisplayComponent implements OnInit { // Implement OnInit
  @Input() items: ItemListaDTO[] = [];
  @Input() isEditMode: boolean = false;
  @Input() venedorId: string | null = null;

  @Output() quantityIncrement = new EventEmitter<ItemListaDTO>();
  @Output() quantityDecrement = new EventEmitter<ItemListaDTO>();
  @Output() itemRemove = new EventEmitter<ItemListaDTO>();

  ngOnInit(): void {
    console.log('ItemListDisplayComponent received items:', this.items);
  }

  trackByItemId(index: number, item: ItemListaDTO): string {
    // In create mode, item.id might not exist, so we use itemOferta.id
      return item.tempId || item.id! || item.itemOferta.id;
  }

  increment(item: ItemListaDTO): void {
    this.quantityIncrement.emit(item);
  }

  decrement(item: ItemListaDTO): void {
    this.quantityDecrement.emit(item);
  }

  remove(item: ItemListaDTO): void {
    this.itemRemove.emit(item);
  }
}
