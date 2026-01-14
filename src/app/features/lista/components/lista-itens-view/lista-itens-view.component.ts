import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ItemListaDTO } from '../../models/item-lista.model';
import { ListaCompraService } from '../../services/lista-compra.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { Page } from '../../../../shared/pipes/page.model';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Lista } from '../../models/lista.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lista-itens-view',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatPaginatorModule,
    CurrencyPipe,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './lista-itens-view.component.html',
  styleUrl: './lista-itens-view.component.scss',
})
export class ListaItensViewComponent implements OnInit {
  @Input() lista!: Lista;

  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog);

  page?: Page<ItemListaDTO>;
  loadingItens = false;
  mensagemErro: string = '';
  deveExibirMensagem = false;
  
  pageSizeOptions = [5, 10, 20];
  defaultPageSize = 5;

  selectedItems = new Set<string>();

  ngOnInit(): void {
    this.loadItens();
  }

  loadItens(page = 0, size = this.defaultPageSize): void {
    if (!this.lista) return;

    this.loadingItens = true;
    this.deveExibirMensagem = false;

    this.listaCompraService.getItensPorLista(this.lista.id!, page, size).subscribe({
      next: (response) => {
        this.page = response;
        this.loadingItens = false;
      },
      error: (err) => {
        this.loadingItens = false;
        this.deveExibirMensagem = true;
        this.mensagemErro =
          err.error?.detail || 'Erro ao carregar os itens da lista.';
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.loadItens(event.pageIndex, event.pageSize);
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }

  onCheckboxChange(itemId: string, isChecked: boolean): void {
    if (isChecked) {
      this.selectedItems.add(itemId);
    } else {
      this.selectedItems.delete(itemId);
    }
  }

  removerItens(): void {
    if (this.selectedItems.size === 0) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja remover ${this.selectedItems.size} item(s) da lista?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const itensParaRemover = Array.from(this.selectedItems);
        this.listaCompraService.removerDaLista(this.lista.id!, itensParaRemover).subscribe({
          next: () => {
            this.selectedItems.clear();
            this.loadItens();
          },
          error: (err) => {
            this.deveExibirMensagem = true;
            this.mensagemErro = err.error?.detail || 'Erro ao remover itens da lista.';
          },
        });
      }
    });
  }

  incrementarQuantidade(item: ItemListaDTO): void {
    const novaQuantidade = item.quantidade + 1;
    this.listaCompraService.atualizarQuantidadeItem(this.lista.id!, item.id, novaQuantidade).subscribe({
      next: () => {
        item.quantidade = novaQuantidade;
      },
      error: (err) => {
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao atualizar a quantidade do item.';
      }
    });
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    if (item.quantidade > 1) {
      const novaQuantidade = item.quantidade - 1;
      this.listaCompraService.atualizarQuantidadeItem(this.lista.id!, item.id, novaQuantidade).subscribe({
        next: () => {
          item.quantidade = novaQuantidade;
        },
        error: (err) => {
          this.deveExibirMensagem = true;
          this.mensagemErro = err.error?.detail || 'Erro ao atualizar a quantidade do item.';
        }
      });
    } else {
      // If quantity is 1, remove the item from the list
      this.listaCompraService.removerDaLista(this.lista.id!, [item.id]).subscribe({
        next: () => {
          this.loadItens(); // Reload the list to reflect the removal
        },
        error: (err) => {
          this.deveExibirMensagem = true;
          this.mensagemErro = err.error?.detail || 'Erro ao remover o item da lista.';
        }
      });
    }
  }
}

