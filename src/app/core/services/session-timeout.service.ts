import { Injectable, inject } from '@angular/core';
import { UsuarioService } from '../../features/auth/services/usuario.service';

const EXPIRATION_KEY = 'token_expires_at';

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {
  private usuarioService = inject(UsuarioService);
  private timer: any;

  constructor() {}

  startTokenExpirationTimer(): void {
    this.stopTokenExpirationTimer();
    const expirationTime = this.getExpirationTime();
    if (expirationTime) {
      const timeout = expirationTime - Date.now();
      if (timeout > 0) {
        this.timer = setTimeout(() => {
          this.usuarioService.logout();
        }, timeout);
      } else {
        this.usuarioService.logout();
      }
    }
  }

  stopTokenExpirationTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  setExpirationTime(expiresIn: number): void {
    const expirationTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(EXPIRATION_KEY, JSON.stringify(expirationTime));
  }

  getExpirationTime(): number | null {
    const expirationTime = localStorage.getItem(EXPIRATION_KEY);
    return expirationTime ? JSON.parse(expirationTime) : null;
  }

  clearExpirationTime(): void {
    localStorage.removeItem(EXPIRATION_KEY);
  }
}
