import { Component, inject, signal } from '@angular/core';
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
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private oauthService = inject(OauthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set('');
      const credentials: LoginRequest = this.loginForm.value as LoginRequest;
      this.usuarioService.login(credentials).subscribe({
        next: (response) => {
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.detail || 'Usuário ou senha inválidos');
        },
        complete: () => {
          this.loading.set(false);
        },
      });
    }
  }

  togglePassword(): void {
    this.hidePassword.update(prev => !prev);
  }

  loginWithGoogle(): void {
    this.loading.set(true);
    window.location.href = `${environment.securityApiUrl}/oauth/google`;
  }

  loginWithGithub(): void {
    this.loading.set(true);
    window.location.href = `${environment.securityApiUrl}/oauth/github`;
  }
}
