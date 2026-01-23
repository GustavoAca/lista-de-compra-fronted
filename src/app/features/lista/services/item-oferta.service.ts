import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../shared/pipes/page.model'; // Corrected path
import { ItemOferta } from '../models/item-oferta.model'; // Adjust path
import { API_CONTEXT } from '../../../core/interceptors/api-context';

@Injectable({
  providedIn: 'root',
})
export class ItemOfertaService {
  private http = inject(HttpClient);
  private itemOfertasApiPath = '/itens-oferta';

  constructor() {}

  getItemOfertasByVendedor(
    vendedorId: string,
    page = 0,
    size = 20,
  ): Observable<Page<ItemOferta>> {
    const url = `${this.itemOfertasApiPath}/vendedor/${vendedorId}`;
    return this.http.get<Page<ItemOferta>>(url, {
      params: {
        page,
        size,
      },
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  getItensOfertaByIds(ids: string[]): Observable<ItemOferta[]> {
    const url = `${this.itemOfertasApiPath}/buscar-por-ids`;
    return this.http.post<ItemOferta[]>(url, ids, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  getItemOfertaById(id: string): Observable<ItemOferta> {
    const url = `${this.itemOfertasApiPath}/${id}`;
    return this.http.get<ItemOferta>(url, {
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  buscarPorVendedorENomeItem(
    vendedorId: string,
    itemNome: string,
    currentItemOffferPage: any,
    pageSize: number,
  ): Observable<Page<ItemOferta>> {
    const url = `${this.itemOfertasApiPath}/buscar-por-vendedor-e-nome-item`;
    return this.http.get<Page<ItemOferta>>(url, {
      params: {
        vendedorId,
        itemNome,
        page: currentItemOffferPage,
        size: pageSize,
      },
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }
}
