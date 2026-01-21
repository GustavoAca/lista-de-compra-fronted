import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { DadosToken } from '../models/dadosToken.models';
import { UsuarioService } from './usuario.service';
import { SessionTimeoutService } from '../../../core/services/session-timeout.service';
import { API_CONTEXT } from '../../../core/interceptors/api-context';

@Injectable({
  providedIn: 'root',
})
export class OauthService {
  private readonly apiPath = '/oauth';
  private readonly usuarioService = inject(UsuarioService);
  private readonly sessionTimeoutService = inject(SessionTimeoutService);

  constructor(private http: HttpClient) {}

  autenticarGithub(code: string) {
    return this.http
      .get<DadosToken>(`${this.apiPath}/github/autorizado`, {
        params: { code },
        context: new HttpContext().set(API_CONTEXT, 'security'),
      })
      .pipe(
        tap((tokens) => {
          this.sessionTimeoutService.setExpirationTime(tokens.expiresIn);
          this.usuarioService.decodeAndStoreToken(
            tokens.token,
            tokens.refreshToken
          );
          this.sessionTimeoutService.startTokenExpirationTimer();
        })
      );
  }

  autenticarGoogle(code: string) {
    return this.http
      .get<DadosToken>(`${this.apiPath}/google/autorizado`, {
        params: { code },
        context: new HttpContext().set(API_CONTEXT, 'security'),
      })
      .pipe(
        tap((tokens) => {
          this.sessionTimeoutService.setExpirationTime(tokens.expiresIn);

          this.usuarioService.decodeAndStoreToken(
            tokens.token,
            tokens.refreshToken
          );
          this.sessionTimeoutService.startTokenExpirationTimer();
        })
      );
  }
}
