import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from './../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { LoginRequest } from '../../models/login.model';
import { Router } from '@angular/router';
import { OauthService } from '../../services/oauth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private oauthService = inject(OauthService);
  private router = inject(Router);
  loading: boolean = false;
  error: string = '';
  hidePassword = true;

  constructor() {
    var token = localStorage.getItem('access_token');
    var refreshToken = localStorage.getItem('refresh_token');
    if (token !== null && refreshToken !== null) {
      this.router.navigate(['/home']);
    }
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';
      const credentials: LoginRequest = this.loginForm.value as LoginRequest;
      this.usuarioService.login(credentials).subscribe({
        next: (response) => {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.detail || 'Usuário ou senha inválidos'; // Changed error message
        },
        complete: () => {
          this.loading = false;
        },
      });
    }
  }

  loginWithGoogle(): void {
    this.loading = true;
    window.location.href = `${environment.securityApiUrl}/oauth/google`;
  }

  loginWithGithub(): void {
    this.loading = true;
    window.location.href = `${environment.securityApiUrl}/oauth/github`;
  }
}
