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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule, // Add MatProgressSpinnerModule
    ListaCardGridComponent,
    InfiniteScrollComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  lists: ListaModel[] = [];

  pageData!: Page<ListaModel>;

  page = 0;

  loading = false;
  loadingItens = false;
  isLastPage = false;

  private router = inject(Router);
  private dialog = inject(MatDialog);
  private shoppingListService = inject(ListaCompraService); // Use original service name for injection

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    if (this.loadingItens || this.isLastPage) {
      return;
    }

    this.loadingItens = true;

    this.shoppingListService.getLists(this.page).subscribe({
      next: (response) => {
        this.lists = [...this.lists, ...response.content];

        this.pageData = response;

        this.isLastPage = response.last;

        this.page++;

        this.loadingItens = false;
        this.loading = false;
      },
      error: () => {
        this.loadingItens = false;
        this.loading = false;
      },
    });
  }

  createList(): void {
    this.router.navigate(['/lista/criar']);
  }

  editList(id: string): void {
    this.router.navigate(['/lista/editar', id]);
  }

  startShopping(list: ListaModel): void {
    this.dialog.open(IniciarCompraComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      data: { list },
      panelClass: 'shopping-modal',
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
