import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fab-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './fab-button.component.html',
  styleUrls: ['./fab-button.component.scss']
})
export class FabButtonComponent {
  @Input() icon: string = 'add';
  @Input() ariaLabel: string = 'Botão de Ação';
  @Output() fabClick = new EventEmitter<void>();

  onFabClick(): void {
    this.fabClick.emit();
  }
}