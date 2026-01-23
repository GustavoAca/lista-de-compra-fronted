import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { ListaModel } from '../../models/lista.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-card-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './lista-card-grid.component.html',
  styleUrl: './lista-card-grid.component.scss',
})
export class ListaCardGridComponent {
  @Input() lists: ListaModel[] = [];
  @Output() editList = new EventEmitter<string>();
  @Output() startShopping = new EventEmitter<ListaModel>();

  constructor(private router: Router) {}

  onEditList(id: string): void {
    this.editList.emit(id);
  }

  onStartShopping(list: ListaModel): void {
    this.startShopping.emit(list);
  }

  onViewPurchase(id: string): void {
    this.router.navigate(['/compra', 'visualizar', id]);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
