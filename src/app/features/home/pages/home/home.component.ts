import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ListaCardGridComponent } from '../../../lista/components/lista-card-grid/lista-card-grid.component';
import { ListaCompraService } from '../../../lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';
import { CreateListDialogComponent } from '@app/shared/components/create-list-dialog/create-list-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ListaCardGridComponent,
    InfiniteScrollComponent,
    LoadingSpinnerComponent,
    FabButtonComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private shoppingListService = inject(ListaCompraService);
  private dialog = inject(MatDialog);

  // Signals para estado reativo
  lists = signal<ListaModel[]>([]);
  totalLists = signal(0);
  loading = signal(false);
  page = signal(0);
  isLastPage = signal(false);

  // Computed para verificar se a lista está vazia
  isEmpty = computed(() => this.lists().length === 0 && !this.loading());

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    if (this.loading() || (this.isLastPage() && this.page() > 0)) {
      return;
    }

    this.loading.set(true);

    this.shoppingListService.getLists(this.page()).subscribe({
      next: (response) => {
        if (this.page() === 0) {
          this.lists.set(response.content);
        } else {
          this.lists.update(prev => [...prev, ...response.content]);
        }
        this.totalLists.set(response.totalElements);
        this.isLastPage.set(response.last);
        this.page.update(p => p + 1);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  openCreateDialog(): void {
    this.router.navigate(['/lista/criar']);
  }

  editList(id: string): void {
    this.router.navigate(['/lista/editar', id]);
  }

  iniciarCompra(list: ListaModel): void {
    this.router.navigate(['/compra/iniciar', list.id]);
  }
}
