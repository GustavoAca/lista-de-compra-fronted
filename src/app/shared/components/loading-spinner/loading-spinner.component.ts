import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThemePalette } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatProgressBarModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  color = input<ThemePalette>('primary');
  type = input<'spinner' | 'bar'>('spinner');
  
  diameter = computed(() => {
    switch (this.size()) {
      case 'sm': return 15;
      case 'md': return 30;
      case 'lg': return 60;
      default: return 30;
    }
  });
}
