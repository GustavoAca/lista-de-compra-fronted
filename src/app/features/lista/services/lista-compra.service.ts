import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs'; // Import map operator
import { ItemListaModel } from '../models/item-lista.model';
import { ItemAlterado } from '../models/item-alterado.model';
import {
  ListaCompraDTO,
  ListaCompraCriacao,
} from '../models/lista-compra-dto.model';
import { ConcluirListaRequestDTO } from '@app/features/compra/models/concluir-lista-request.dto';
import { API_CONTEXT } from '../../../core/interceptors/api-context';
import { ListaModel } from '../models/lista.model';
import { Page } from '@app/shared/pipes/page.model';
import { ListaCompraEdicaoRequest } from '../models/lista-compra-edicao-request.model'; // New import

@Injectable({
  providedIn: 'root',
})
export class ListaCompraService {
  private http = inject(HttpClient);

  private apiPath = '/listas-compras';

  constructor() {}

  getLists(page = 0, size = 20): Observable<Page<ListaModel>> { // Renamed and updated return type
    return this.http.get<Page<ListaModel>>(this.apiPath, {
      params: {
        page,
        size,
        sort: 'modifiedDate,DESC',
      },
      context: new HttpContext().set(API_CONTEXT, 'list'),
    }).pipe(
      map(response => response as Page<ListaModel>) // Map to extract content
    );
  }

  getItensPorLista(
    listaId: string,
    page = 0,
    size = 10
  ): Observable<Page<ItemListaModel>> { // Keep original return type for now, will be refactored later
    const url = `${this.apiPath}/${listaId}/itens`;
    return this.http.get<Page<ItemListaModel>>(url, {
      params: {
        page,
        size,
      },
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  getListaById(listaId: string): Observable<ListaModel> { // Updated return type
    const url = `${this.apiPath}/${listaId}`;
    return this.http.get<ListaModel>(url, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  adicionarItensALista(
    listaId: string,
    itensParaAdicionar: { itemOfertaId: string; quantidade: number }[]
  ): Observable<ItemListaModel[]> {
    const url = `${this.apiPath}/${listaId}/adicionar-itens`;
    return this.http.post<ItemListaModel[]>(url, itensParaAdicionar, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  alterarItens(
    listaId: string,
    itensAlterados: ItemAlterado[]
  ): Observable<void> {
    const url = `${this.apiPath}/${listaId}/alterar-itens`;
    return this.http.put<void>(url, itensAlterados, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  criarLista(listaCompraDTO: ListaCompraCriacao): Observable<ListaModel> {
    return this.http.post<ListaModel>(this.apiPath, listaCompraDTO, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  concluirCompra(dto: ConcluirListaRequestDTO): Observable<void> {
    const url = `${this.apiPath}/concluir`;
    return this.http.put<void>(url, dto, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  removerItemDaLista(listaId: string, itemListaId: string): Observable<void> {
    const url = `${this.apiPath}/${listaId}/itens/${itemListaId}`;
    return this.http.delete<void>(url, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  deletarLista(listaId: string): Observable<void> {
    const url = `${this.apiPath}/${listaId}`;
    return this.http.delete<void>(url, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  atualizarLista(lista: ListaModel): Observable<ListaModel> {
    const url = `${this.apiPath}/${lista.id}`;
    return this.http.put<ListaModel>(url, lista, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  atualizarListaCompleta(request: ListaCompraEdicaoRequest): Observable<ListaModel> {
    const url = `${this.apiPath}`;
    return this.http.put<ListaModel>(url, request, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }
}

