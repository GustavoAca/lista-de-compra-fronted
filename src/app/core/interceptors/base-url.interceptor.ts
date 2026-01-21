import {
  HttpContext,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_CONTEXT } from './api-context';

export const baseUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const apiReq = req.clone({ url: `${getBaseUrl(req.context)}${req.url}` });

  return next(apiReq);
};

function getBaseUrl(context: HttpContext): string {
  const api = context.get(API_CONTEXT);

  if (api === 'security') {
    return environment.securityApiUrl;
  }

  return environment.listApiUrl;
}
