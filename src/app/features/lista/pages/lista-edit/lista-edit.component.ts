import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListaCompraService } from '../../services/lista-compra.service';
import { Lista } from '../../models/lista.model';
import { ItemListaDTO } from '../../models/item-lista.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-lista-edit',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    MatDialogModule,
  ],
  templateUrl: './lista-edit.component.html',
  styleUrl: './lista-edit.component.scss'
})
export class ListaEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private listaCompraService = inject(ListaCompraService);
  private dialog = inject(MatDialog);

  listaId!: string;
  lista!: Lista;
  itens: ItemListaDTO[] = [];
  loading = true;
  mensagemErro: string = '';
  deveExibirMensagem = false;

  private routeSubscription!: Subscription;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.listaId = params.get('id')!;
      this.loadListaDetails();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadListaDetails(): void {
    this.loading = true;
    this.deveExibirMensagem = false;

    this.listaCompraService.getListaById(this.listaId).subscribe({
      next: (listaResponse) => {
        this.lista = listaResponse;
        this.loadListaItems();
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao carregar detalhes da lista.';
      }
    });
  }

  loadListaItems(): void {
    this.listaCompraService.getItensPorLista(this.listaId, 0, 1000).subscribe({
      next: (pageResponse) => {
        this.itens = pageResponse.content;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao carregar itens da lista.';
      }
    });
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }

  incrementarQuantidade(item: ItemListaDTO): void {
    this.loading = true;
    const novaQuantidade = item.quantidade + 1;
    this.listaCompraService.atualizarQuantidadeItem(this.listaId, item.id, novaQuantidade).subscribe({
      next: () => {
        item.quantidade = novaQuantidade;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.deveExibirMensagem = true;
        this.mensagemErro = err.error?.detail || 'Erro ao atualizar a quantidade do item.';
      }
    });
  }

  decrementarQuantidade(item: ItemListaDTO): void {
    this.loading = true;
    if (item.quantidade > 1) {
      const novaQuantidade = item.quantidade - 1;
      this.listaCompraService.atualizarQuantidadeItem(this.listaId, item.id, novaQuantidade).subscribe({
        next: () => {
          item.quantidade = novaQuantidade;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.deveExibirMensagem = true;
          this.mensagemErro = err.error?.detail || 'Erro ao atualizar a quantidade do item.';
        }
      });
    } else {
      this.removerItem(item); // If quantity is 1, remove the item
    }
  }

  removerItem(item: ItemListaDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja remover o item "${item.itemOferta.item.nome}" da lista?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.listaCompraService.removerDaLista(this.listaId, [item.id]).subscribe({
          next: () => {
            this.itens = this.itens.filter(i => i.id !== item.id);
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.deveExibirMensagem = true;
            this.mensagemErro = err.error?.detail || 'Erro ao remover o item da lista.';
          },
        });
      }
    });
  }
}
