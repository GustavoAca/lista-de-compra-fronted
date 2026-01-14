import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'app-alert-message',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './alert-message.component.html',
  styleUrl: './alert-message.component.scss',
})
export class AlertMessageComponent {
  @Input() message: string = '';
  @Input() type: AlertType = 'info';
  @Input() showCloseButton: boolean = true;
  @Output() closed = new EventEmitter<void>();
  @Input() autoClose = false;
  @Input() duration = 3000;
  private timeoutId?: number;

  ngOnInit(): void {
    if (this.autoClose) {
      this.timeoutId = window.setTimeout(() => {
        this.onClose();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  getIcon(): string {
    switch (this.type) {
      case 'success':
        return 'check_circle';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  onClose(): void {
    this.closed.emit();
  }
}
