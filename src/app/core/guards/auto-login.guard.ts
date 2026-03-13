import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const autoLoginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (token && refreshToken) {
    // Se já estiver logado, redireciona para a home ao tentar acessar o login
    router.navigate(['/home']);
    return false;
  }

  return true;
};
