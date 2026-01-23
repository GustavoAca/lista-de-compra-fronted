import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../features/auth/services/usuario.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-cabecalho',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './cabecalho.component.html',
  styleUrls: ['./cabecalho.component.scss']
})
export class CabecalhoComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Nossa Compra';
  showBackButton: boolean = false;

  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
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
      this.pageTitle = data['title'] || 'Nossa Compra';
      this.showBackButton = data['showBackButton'] === true;
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  logout(): void {
    this.usuarioService.logout();
  }

  navigateBack(): void {
    this.router.navigate(['/home']);
  }
}
