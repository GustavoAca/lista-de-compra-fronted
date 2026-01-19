import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ListaModel } from '../models/lista.model'; // Updated import
import { Page } from '../../../shared/pipes/page.model';
import { ItemListaModel } from '../models/item-lista.model'; // Updated import
import { ItemAlterado } from '../models/item-alterado.model';
import { ListaCompraDTO, ListaCompraCriacao } from '../models/lista-compra-dto.model';


@Injectable({
  providedIn: 'root',
})
export class ListaCompraService {
  private http = inject(HttpClient);

  private apiPath = '/listas-compras';

  constructor() {}

  getListaCompras(page = 0, size = 10): Observable<Page<ListaModel>> { // Updated return type
    return this.http.get<Page<ListaModel>>(this.apiPath, {
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
  ): Observable<Page<ItemListaModel>> { // Updated return type
    const url = `${this.apiPath}/${listaId}/itens`;
    return this.http.get<Page<ItemListaModel>>(url, {
      params: {
        page,
        size,
      },
    });
  }

  getListaById(listaId: string): Observable<ListaModel> { // Updated return type
    const url = `${this.apiPath}/${listaId}`;
    return this.http.get<ListaModel>(url);
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

  criarLista(listaCompraDTO: ListaCompraCriacao): Observable<any> {
    console.table(listaCompraDTO);
    return this.http.post(this.apiPath, listaCompraDTO);
  }
}
