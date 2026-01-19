import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../shared/pipes/page.model'; // Corrected path
import { ItemOferta } from '../models/item-oferta.model'; // Adjust path

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
    size = 10
  ): Observable<Page<ItemOferta>> {
    const url = `${this.itemOfertasApiPath}/vendedor/${vendedorId}`;
    return this.http.get<Page<ItemOferta>>(url, {
      params: {
        page,
        size,
      },
    });
  }

  getItensOfertaByIds(ids: string[]): Observable<ItemOferta[]> {
    const url = `${this.itemOfertasApiPath}/buscar-por-ids`;
    return this.http.post<ItemOferta[]>(url, ids);
  }

  getItemOfertaById(id: string): Observable<ItemOferta> {
    const url = `${this.itemOfertasApiPath}/${id}`;
    return this.http.get<ItemOferta>(url);
  }
}

