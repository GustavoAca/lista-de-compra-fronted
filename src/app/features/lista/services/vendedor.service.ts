import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../shared/pipes/page.model'; // Corrected path
import { VendedorDTO } from '../models/vendedor.model'; // Adjust path

@Injectable({
  providedIn: 'root',
})
export class VendedorService {
  private http = inject(HttpClient);

  private vendedoresApiPath = '/vendedores';

  constructor() {}

  getVendedores(page = 0, size = 20): Observable<Page<VendedorDTO>> {
    return this.http.get<Page<VendedorDTO>>(this.vendedoresApiPath, {
      params: {
        page,
        size,
      },
    });
  }
}
