import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaCardGridComponent } from '../../../lista/components/lista-card-grid/lista-card-grid.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,
    ListaCardGridComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
}
