import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Lista } from '../models/lista.model';
import { Page } from '../../../shared/pipes/page.model';

@Injectable({
  providedIn: 'root',
})
export class ListaCompraService {
  // Injeta o HttpClient para fazer requisições HTTP.
  private http = inject(HttpClient);

  // Caminho relativo para a sua API. O interceptor adicionará a URL base.
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
}
