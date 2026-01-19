import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../shared/pipes/page.model'; // Corrected path
import { VendedorModel } from '../models/vendedor.model'; // Updated import

@Injectable({
  providedIn: 'root',
})
export class VendedorService {
  private http = inject(HttpClient);

  private vendedoresApiPath = '/vendedores';

  constructor() {}

  getVendedores(page = 0, size = 20): Observable<Page<VendedorModel>> { // Updated type
    return this.http.get<Page<VendedorModel>>(this.vendedoresApiPath, {
      params: {
        page,
        size,
      },
    });
  }
}
