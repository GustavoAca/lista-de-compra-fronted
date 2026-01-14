import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { UsuarioService } from '../../features/auth/services/usuario.service';
import { LoginResponse } from '../../features/auth/models/login.model';
import { JwtHelperService } from '@auth0/angular-jwt';

// --- State must be outside the interceptor function to be preserved ---
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
  null
);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const usuarioService = inject(UsuarioService);
  const jwtHelperService = inject(JwtHelperService);
  const accessToken = localStorage.getItem('access_token');

  if (accessToken && !req.url.includes('/atualizar-token')) {
    req = addToken(req, accessToken);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, usuarioService, jwtHelperService);
      } else {
        return throwError(() => error);
      }
    })
  );
};

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  usuarioService: UsuarioService,
  JwtHelperService: JwtHelperService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    var refreshToken = localStorage.getItem('refresh_token');
    var accessToken = localStorage.getItem('access_token');

    if (!refreshToken || !accessToken) {
      // trate erro, redirecione para login, logout, etc.
      throw new Error('Tokens não encontrados no localStorage');
    }

    usuarioService.decodeAndStoreToken(accessToken, refreshToken);
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      throw new Error('User token não encontrado');
    }

    if (refreshToken) {
      return usuarioService.refreshToken(userToken).pipe(
        switchMap((response: LoginResponse) => {
          isRefreshing = false;
          refreshTokenSubject.next(response.accessToken);

          usuarioService.decodeAndStoreToken(
            response.accessToken,
            response.refreshToken
          );

          return next(addToken(request, response.accessToken));
        }),
        catchError((err) => {
          isRefreshing = false;
          usuarioService.logout();
          return throwError(() => err);
        })
      );
    } else {
      isRefreshing = false;
      usuarioService.logout();
      return throwError(() => new Error('Refresh token não encontrado'));
    }
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((jwt) => {
        return next(addToken(request, jwt));
      })
    );
  }
}

function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
