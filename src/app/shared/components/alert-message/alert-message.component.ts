import { Component, input, output, computed, effect, OnInit, OnDestroy } from '@angular/core';
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
export class AlertMessageComponent implements OnInit, OnDestroy {
  message = input<string>('');
  type = input<AlertType>('info');
  showCloseButton = input<boolean>(true);
  autoClose = input<boolean>(false);
  duration = input<number>(3000);
  
  closed = output<void>();
  
  private timeoutId?: number;

  icon = computed(() => {
    switch (this.type()) {
      case 'success': return 'check_circle';
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  });

  ngOnInit(): void {
    if (this.autoClose()) {
      this.timeoutId = window.setTimeout(() => {
        this.onClose();
      }, this.duration());
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onClose(): void {
    this.closed.emit();
  }
}
