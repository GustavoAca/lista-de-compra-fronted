import { LoadingSpinnerComponent } from './../../../../shared/components/loading-spinner/loading-spinner.component';
import { environment } from './../../../../../environments/environment';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { LoginRequest } from '../../models/login.model';
import { Router } from '@angular/router';
import { AlertMessageComponent } from '../../../../shared/components/alert-message/alert-message.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    AlertMessageComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  loading: boolean = false;
  mensagemErro: string = '';
  deveExibirMensagem: boolean = false;

  constructor() {
    var token = localStorage.getItem('access_token');
    var refreshToken = localStorage.getItem('refresh_token');
    if (token !== null && refreshToken !== null) {
      this.router.navigate(['/home']);
    }
    this.loginForm = this.fb.group({
      username: ['', Validators.email],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value as LoginRequest;
      this.loading = true;
      this.usuarioService.login(credentials).subscribe({
        next: (response) => {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading = false;
          this.deveExibirMensagem = true;
          this.mensagemErro = err.error?.detail;
        },
        complete: () => {
          this.loading = false;
        },
      });
    } else {
    }
  }

  loginComGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth/google`;
  }

  loginComGithub(): void {
    window.location.href = `${environment.apiUrl}/oauth/github`;
  }

  onAlertClosed(): void {
    this.deveExibirMensagem = false;
    this.mensagemErro = '';
  }
}
