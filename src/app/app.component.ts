import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CabecalhoComponent } from './componentes/cabecalho/cabecalho.component';
import { MatButtonModule } from '@angular/material/button';
import { SessionTimeoutService } from './core/services/session-timeout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CabecalhoComponent, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private sessionTimeoutService = inject(SessionTimeoutService);
  showHeader: boolean = false;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showHeader = !event.urlAfterRedirects.includes('/login');
    });
  }

  ngOnInit(): void {
    this.sessionTimeoutService.startTokenExpirationTimer();
  }
}
