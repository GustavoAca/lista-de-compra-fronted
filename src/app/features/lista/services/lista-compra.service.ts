import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Lista } from '../models/lista.model';
import { Page } from '../../../shared/pipes/page.model';
import { ItemListaDTO } from '../models/item-lista.model';
import { ItemAlterado } from '../models/item-alterado.model';
import { ListaCompraDTO } from '../models/lista-compra-dto.model';


@Injectable({
  providedIn: 'root',
})
export class ListaCompraService {
  private http = inject(HttpClient);

  private apiPath = '/listas-compras';

  constructor() {}

  getListaCompras(page = 0, size = 10): Observable<Page<Lista>> {
    return this.http.get<Page<Lista>>(this.apiPath, {
      params: {
        page,
        size,
      },
    });
  }

  getItensPorLista(
    listaId: string,
    page = 0,
    size = 10
  ): Observable<Page<ItemListaDTO>> {
    const url = `${this.apiPath}/${listaId}/itens`;
    return this.http.get<Page<ItemListaDTO>>(url, {
      params: {
        page,
        size,
      },
    });
  }

  getListaById(listaId: string): Observable<Lista> {
    const url = `${this.apiPath}/${listaId}`;
    return this.http.get<Lista>(url);
  }

  adicionarItensALista(
    listaId: string,
    itensParaAdicionar: { itemOfertaId: string; quantidade: number }[]
  ): Observable<any> {
    const url = `${this.apiPath}/${listaId}/adicionar-itens`;
    return this.http.post(url, itensParaAdicionar);
  }

  alterarItens(
    listaId: string,
    itensAlterados: ItemAlterado[]
  ): Observable<any> {
    const url = `${this.apiPath}/${listaId}/alterar-itens`;
    return this.http.put(url,  itensAlterados );
  }

  criarLista(listaCompraDTO: ListaCompraDTO): Observable<any> {
    return this.http.post(this.apiPath, listaCompraDTO);
  }
}
