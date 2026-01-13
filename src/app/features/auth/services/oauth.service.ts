import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { DadosToken } from '../models/dadosToken.models';

@Injectable({
  providedIn: 'root',
})
export class OauthService {
  private apiPath = '/oauth';

  constructor(private http: HttpClient) {}

  autenticarGithub(code: string) {
    return this.http.get<DadosToken>(
      `${this.apiPath}/github/autorizado`,
      { params: { code } }
    ).pipe(
      tap(tokens => {
        localStorage.setItem('access_token', tokens.token);
        localStorage.setItem('refresh_token', tokens.refreshToken);
      })
    );
  }

  autenticarGoogle(code: string) {
    return this.http.get<DadosToken>(
      `${this.apiPath}/google/autorizado`,
      { params: { code } }
    ).pipe(
      tap(tokens => {
        localStorage.setItem('access_token', tokens.token);
        localStorage.setItem('refresh_token', tokens.refreshToken);
      })
    );
  }
}
