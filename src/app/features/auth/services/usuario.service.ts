import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private authApiPath = '/usuarios'; // Assumindo que o endpoint de login é /users/login

  constructor() {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = `${this.authApiPath}/login`;
    return this.http.post<LoginResponse>(url, credentials);
  }

  // Métodos para logout, registro, etc., podem ser adicionados aqui
}
