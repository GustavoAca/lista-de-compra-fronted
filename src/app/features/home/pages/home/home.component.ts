import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListaCardGridComponent } from '../../../lista/components/lista-card-grid/lista-card-grid.component';
import { ListaCompraService } from '../../../lista/services/lista-compra.service';
import { ListaModel } from '@app/features/lista/models/lista.model';
import { InfiniteScrollComponent } from '@app/shared/components/infinite-scroll/infinite-scroll.component';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { FabButtonComponent } from '@app/shared/components/fab-button/fab-button.component';

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
    FabButtonComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private shoppingListService = inject(ListaCompraService);

  // Signals para estado reativo
  lists = signal<ListaModel[]>([]);
  loading = signal(false);
  page = signal(0);
  isLastPage = signal(false);

  // Computed para verificar se a lista está vazia
  isEmpty = computed(() => this.lists().length === 0 && !this.loading());

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    if (this.loading() || this.isLastPage()) {
      return;
    }

    this.loading.set(true);

    this.shoppingListService.getLists(this.page()).subscribe({
      next: (response) => {
        this.lists.update(prev => [...prev, ...response.content]);
        this.isLastPage.set(response.last);
        this.page.update(p => p + 1);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
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
}
