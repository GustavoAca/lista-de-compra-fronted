import { OauthService } from './../../services/oauth.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: '<p>Processando login...</p>',
})
export class OauthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private oauthService = inject(OauthService);

  ngOnInit(): void {
    const provider = this.route.snapshot.paramMap.get('provider');
    const code = this.route.snapshot.queryParams['code'];

    if (!code || (provider !== 'google' && provider !== 'github')) {
      console.warn('Callback OAuth inválido');
      this.router.navigate(['/login']);
      return;
    }

    if (provider === 'google') {
      this.oauthService.autenticarGoogle(code).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => this.router.navigate(['/login']),
      });
    }

    if (provider === 'github') {
      this.oauthService.autenticarGithub(code).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => this.router.navigate(['/login']),
      });
    }
  }
}

