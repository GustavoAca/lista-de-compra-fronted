import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ListaCardGridComponent } from '../../../lista/components/lista-card-grid/lista-card-grid.component';
import { ListaCompraService } from '../../../lista/services/lista-compra.service'; // Corrected import path
import { IniciarCompraComponent } from '../../../compra/pages/iniciar-compra/iniciar-compra.component'; // Corrected import path
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import MatProgressSpinnerModule
import { ListaModel } from '@app/features/lista/models/lista.model';
import { Page } from '@app/shared/pipes/page.model';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ListaCardGridComponent,
    InfiniteScrollComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  lists: ListaModel[] = [];

  pageData!: Page<ListaModel>;

  page = 0;

  loadingLista = false;
  isLastPage = false;

  private router = inject(Router);
  private shoppingListService = inject(ListaCompraService); // Use original service name for injection

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    if (this.loadingLista || this.isLastPage) {
      return;
    }

    this.loadingLista = true;

    this.shoppingListService.getLists(this.page).subscribe({
      next: (response) => {
        this.lists = [...this.lists, ...response.content];

        this.pageData = response;

        this.isLastPage = response.last;

        this.page++;

        this.loadingLista = false;
      },
      error: () => {
        this.loadingLista = false;
      },
    });
  }

  createList(): void {
    this.router.navigate(['/lista/criar']);
  }

  editList(id: string): void {
    this.router.navigate(['/lista/editar', id]);
  }

  iniciarCompra(list: ListaModel): void {
    this.router.navigate(['/compra/iniciar', list.id]);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
