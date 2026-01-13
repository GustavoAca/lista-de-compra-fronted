import { environment } from './../../../../../environments/environment';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OauthService } from '../../services/oauth.service';
import { UsuarioService } from '../../services/usuario.service'; // Importar UsuarioService
import { LoginRequest } from '../../models/login.model'; // Importar LoginRequest
import { Router } from '@angular/router'; // Importar Router

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Importa o ReactiveFormsModule para usar formulários reativos
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService); // Injetar UsuarioService
  private router = inject(Router); // Injetar Router

  constructor() {
    var token = localStorage.getItem('access_token');
    var refreshToken = localStorage.getItem('refresh_token');
    if ((token !== null) && (refreshToken !== null)) {
      this.router.navigate(['/home']); // Redirecionar para a home
    }
    this.loginForm = this.fb.group({
      username: [''], // Atualizado para 'email'
      password: [''],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Formulário enviado:', this.loginForm.value);
      const credentials: LoginRequest = this.loginForm.value as LoginRequest;
      this.usuarioService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login bem-sucedido:', response);
          // Armazenar tokens (ex: localStorage, sessionStorage, ou um serviço de autenticação)
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.router.navigate(['/home']); // Redirecionar para a home
        },
        error: (err) => {
          console.error('Erro no login:', err);
          // Exibir mensagem de erro para o usuário (ex: um toast, uma mensagem no formulário)
        },
      });
    } else {
      console.log('Formulário inválido');
    }
  }

  loginComGoogle(): void {
    console.log('Iniciando login com Google...');
    window.location.href = `${environment.apiUrl}/oauth/google`;
  }

  loginComGithub(): void {
    console.log('Iniciando login com GitHub...');
    window.location.href = `${environment.apiUrl}/oauth/github`;
  }
}
