import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (token && refreshToken) {
    return true;
  }

  // Se não estiver logado, redireciona para o login
  router.navigate(['/login']);
  return false;
};
