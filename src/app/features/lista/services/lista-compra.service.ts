import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ListaCompraService {
  // Injeta o HttpClient para fazer requisições HTTP.
  private http = inject(HttpClient);

  // Caminho relativo para a sua API. O interceptor adicionará a URL base.
  private apiPath = '/itens';

  constructor() { }

  // Busca todos os itens da lista de compras.
  getItens(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiPath);
  }

  // Adiciona um novo item à lista.
  addItem(item: Omit<Item, 'id'>): Observable<Item> {
    return this.http.post<Item>(this.apiPath, item);
  }

  // Atualiza um item existente na lista.
  updateItem(id: string | number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiPath}/${id}`, item);
  }

  // Deleta um item da lista.
  deleteItem(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiPath}/${id}`);
  }
}
