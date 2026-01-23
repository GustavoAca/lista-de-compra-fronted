import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CabecalhoComponent } from './componentes/cabecalho/cabecalho.component';
import { MatButtonModule } from '@angular/material/button';
import { SessionTimeoutService } from './core/services/session-timeout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CabecalhoComponent, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private sessionTimeoutService = inject(SessionTimeoutService);
  private routerSubscription!: Subscription;

  showHeader: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.sessionTimeoutService.startTokenExpirationTimer();

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
      this.showHeader = data['hideHeader'] !== true;
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
