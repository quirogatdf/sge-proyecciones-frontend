import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente fantasma que redirige al dashboard si está autenticado,
 * o al login si no. Se usa en la ruta raíz ('').
 */
@Component({ template: '' })
export class RedirectComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  constructor() {
    const target = this.authService.isAuthenticated() ? '/dashboard' : '/login';
    this.router.navigate([target], { replaceUrl: true });
  }
}
