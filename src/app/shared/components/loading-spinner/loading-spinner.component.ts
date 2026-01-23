import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThemePalette } from '@angular/material/core';
import {ProgressBarMode, MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSliderModule} from '@angular/material/slider';
import {FormsModule} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule,

    MatCardModule, MatRadioModule, FormsModule, MatSliderModule, MatProgressBarModule
  ],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: ThemePalette = 'primary';
  @Input() type: 'spinner' | 'bar' = 'spinner';
  mode: 'query' = 'query';

  get diameter(): number {
    switch (this.size) {
      case 'sm':
        return 15;
      case 'md':
        return 30;
      case 'lg':
        return 60;
      default:
        return 30;
    }
  }
}
