import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../shared/pipes/page.model'; // Corrected path
import { VendedorModel } from '../models/vendedor.model'; // Updated import
import { API_CONTEXT } from '../../../core/interceptors/api-context';

@Injectable({
  providedIn: 'root',
})
export class VendedorService {
  private http = inject(HttpClient);

  private vendedoresApiPath = '/vendedores';

  constructor() {}

  getVendedores(page = 0, size = 20): Observable<Page<VendedorModel>> {
    // Updated type
    return this.http.get<Page<VendedorModel>>(this.vendedoresApiPath, {
      params: {
        page,
        size,
      },
      context: new HttpContext().set(API_CONTEXT, 'list'),
    });
  }

  getVendedoresByName(
    nome: string,
    page = 0,
    size = 20
  ): Observable<Page<VendedorModel>> {
    return this.http.get<Page<VendedorModel>>(
      `${this.vendedoresApiPath}/buscar-por-nome`,
      {
        params: {
          nome,
          page,
          size,
        },
        context: new HttpContext().set(API_CONTEXT, 'list'),
      }
    );
  }
}
