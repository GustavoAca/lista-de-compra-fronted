import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajuste o caminho conforme necessário

export const baseUrlInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Verifica se a requisição já tem uma URL completa ou é para um recurso local (ex: assets)
  // Ou se já aponta para um domínio externo, não queremos interceptar.
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  // Clona a requisição e adiciona a URL base do ambiente
  const apiReq = req.clone({ url: `${environment.apiUrl}${req.url}` });

  return next(apiReq);
};
