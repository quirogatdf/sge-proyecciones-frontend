import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideLogIn } from '@lucide/angular';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, LucideLogIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Logo / Header -->
        <div class="login-header">
          <div class="logo-icon">
            <span class="logo-text">SGE</span>
          </div>
          <h1 class="title">Sistema de Gestión Educativa</h1>
          <p class="subtitle">Proyecciones de Personal</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onLogin()" class="login-form">
          <!-- Error message -->
          @if (error()) {
            <div class="alert-error">
              {{ error() }}
            </div>
          }

          <div class="field">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Ingresá tu usuario"
              [ngModel]="username()"
              (ngModelChange)="username.set($event); error.set('')"
              name="username"
              autocomplete="username"
              [disabled]="loading()"
              class="input"
            />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Ingresá tu contraseña"
              [ngModel]="password()"
              (ngModelChange)="password.set($event); error.set('')"
              name="password"
              autocomplete="current-password"
              [disabled]="loading()"
              class="input"
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Ingresando...
            } @else {
              <svg lucideLogIn [size]="18"></svg>
              Ingresar
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--background);
        padding: 1rem;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      }

      .login-header {
        text-align: center;
        padding: 2rem 2rem 1.5rem;
        border-bottom: 1px solid var(--border);
      }

      .logo-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: var(--primary);
        border-radius: 12px;
        margin-bottom: 1rem;
      }

      .logo-text {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--primary-foreground);
        letter-spacing: 0.05em;
      }

      .title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--foreground);
        margin: 0 0 0.25rem;
      }

      .subtitle {
        font-size: 0.875rem;
        color: var(--muted-foreground);
        margin: 0;
      }

      .login-form {
        padding: 1.5rem 2rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .alert-error {
        padding: 0.75rem 1rem;
        background: color-mix(in oklch, var(--destructive) 10%, transparent);
        border: 1px solid color-mix(in oklch, var(--destructive) 30%, transparent);
        border-radius: var(--radius);
        color: var(--destructive);
        font-size: 0.875rem;
        text-align: center;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .field label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--foreground);
      }

      .input {
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
        background: var(--background);
        color: var(--foreground);
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 15%, transparent);
      }

      .input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-submit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.625rem 1rem;
        background: var(--primary);
        color: var(--primary-foreground);
        border: none;
        border-radius: var(--radius);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 0.5rem;
      }

      .btn-submit:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--primary-foreground);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        display: inline-block;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  constructor() {
    // Si ya está autenticado, lo mandamos directo al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  async onLogin(): Promise<void> {
    if (!this.username() || !this.password()) {
      this.error.set('Completá usuario y contraseña');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      await this.authService.login(this.username(), this.password());
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        this.error.set('Usuario o contraseña incorrectos');
      } else {
        this.error.set('Error de conexión. Intentá de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
