import { SessionTimeoutService } from './../../../core/services/session-timeout.service';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/login.model';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { DecodedToken } from '../models/decodedToken.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private jwtHelper = inject(JwtHelperService);
  private sessionTimeoutService = inject(SessionTimeoutService);
  private authApiPath = '/usuarios';

  constructor() {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = `${this.authApiPath}/login`;
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap((response) => {
        this.sessionTimeoutService.setExpirationTime(response.expiresIn);
        this.decodeAndStoreToken(response.accessToken, response.refreshToken);
        this.sessionTimeoutService.startTokenExpirationTimer();
      })
    );
  }

  refreshToken(refreshToken: string): Observable<LoginResponse> {
    const url = `${this.authApiPath}/atualizar-token`;
    return this.http.post<LoginResponse>(url, { refreshToken }).pipe(
      tap((response) => {
        this.sessionTimeoutService.setExpirationTime(response.expiresIn);
        this.decodeAndStoreToken(response.accessToken, response.refreshToken);
        this.sessionTimeoutService.startTokenExpirationTimer();
      })
    );
  }

  logout(): void {
    this.sessionTimeoutService.stopTokenExpirationTimer();
    this.sessionTimeoutService.clearExpirationTime();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_token');
    this.router.navigate(['/login']);
  }

  decodeAndStoreToken(accessToken: string, refreshToken: string): void {
    const decodedToken = this.jwtHelper.decodeToken(refreshToken);

    const parsedSub = decodedToken.sub
      .split(',')
      .map((item: string) => item.trim())
      .reduce((acc: any, curr: string) => {
        const [rawKey, rawValue] = curr.split(':');

        const key = rawKey.trim();
        const value: string = rawValue?.trim();

        acc[key] = value;
        return acc;
      }, {} as DecodedToken);

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('username', parsedSub.username);
    localStorage.setItem('userId', parsedSub.userId.toString());
    localStorage.setItem('user_token', parsedSub.refreshToken);
  }
}
