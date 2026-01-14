import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajuste o caminho conforme necessário

export const baseUrlInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {

  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {

    return next(req);
  }

  const apiReq = req.clone({ url: `${environment.apiUrl}${req.url}` });

  return next(apiReq);
};
