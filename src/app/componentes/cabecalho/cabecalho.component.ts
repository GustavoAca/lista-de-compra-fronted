import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../features/auth/services/usuario.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { HeaderService } from '../../core/services/header.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-cabecalho',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './cabecalho.component.html',
  styleUrls: ['./cabecalho.component.scss']
})
export class CabecalhoComponent implements OnInit, OnDestroy {
  public headerService = inject(HeaderService);
  public themeService = inject(ThemeService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  
  pageTitle: string = 'Nossa Compra';
  showBackButton: boolean = false;
  private routerSubscription!: Subscription;

  ngOnInit(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // Prioriza título do HeaderService se existir, senão usa do roteador
      this.pageTitle = data['title'] || 'Nossa Compra';
      this.showBackButton = data['showBackButton'] === true;
      
      // Reseta o estado dinâmico ao navegar
      if (!this.router.url.includes('/editar/')) {
        this.headerService.reset();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  logout(): void {
    this.usuarioService.logout();
  }

  navigateBack(): void {
    const customAction = this.headerService.backAction();
    if (customAction) {
      customAction();
      return;
    }

    // Se estiver em uma tela de edição, volta para home
    if (this.router.url.includes('/editar/')) {
      this.router.navigate(['/home']);
    } else {
      window.history.back();
    }
  }
}
