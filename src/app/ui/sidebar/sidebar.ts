import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideLayoutGrid,
  LucideBuilding2,
  LucideBriefcase,
  LucideClock,
  LucideUserSquare,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideHome,
  LucideLogOut,
  LucideUser,
  LucideShieldCheck,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutGrid,
    LucideBuilding2,
    LucideBriefcase,
    LucideClock,
    LucideUserSquare,
    LucideFileSpreadsheet,
    LucideFileText,
    LucideHome,
    LucideLogOut,
    LucideUser,
    LucideShieldCheck,
  ],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-text">SGE - Proyecciones</span>
      </div>

      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg lucideHome [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Mi escritorio</span>
        </a>
        <a routerLink="/proyecciones" routerLinkActive="active" class="nav-item">
          <svg lucideFileSpreadsheet [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Proyecciones</span>
        </a>
        <a routerLink="/niveles" routerLinkActive="active" class="nav-item">
          <svg lucideLayoutGrid [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Niveles</span>
        </a>
        <a routerLink="/instituciones" routerLinkActive="active" class="nav-item">
          <svg lucideBuilding2 [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Instituciones</span>
        </a>
        <a routerLink="/cargos" routerLinkActive="active" class="nav-item">
          <svg lucideBriefcase [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Cargos</span>
        </a>
        <a routerLink="/turnos" routerLinkActive="active" class="nav-item">
          <svg lucideClock [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Turnos</span>
        </a>
        <a routerLink="/resoluciones" routerLinkActive="active" class="nav-item">
          <svg lucideFileText [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Resoluciones</span>
        </a>
        <a routerLink="/funciones" routerLinkActive="active" class="nav-item">
          <svg lucideUserSquare [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Función/Perfil</span>
        </a>
      </nav>

      <!-- User info & logout -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <svg lucideUser [size]="18"></svg>
          </div>
          <div class="user-details">
            <span class="user-name">{{ authService.user()?.name }}</span>
            <span class="user-role">
              <svg lucideShieldCheck [size]="12"></svg>
              {{ authService.user()?.role === 'admin' ? 'Administrador' : 'Invitado' }}
            </span>
          </div>
        </div>
        <button class="logout-btn" (click)="onLogout()">
          <svg lucideLogOut [size]="18"></svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .sidebar {
        width: 260px;
        height: 100vh;
        background: var(--surface);
        border-inline-end: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        position: fixed;
        inset-block-start: 0;
        inset-inline-start: 0;
      }

      .logo {
        padding: 1.5rem;
        border-block-end: 1px solid var(--border);
      }

      .logo-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--foreground);
      }

      .nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        overflow-y: auto;
        padding-block: 0.5rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: var(--muted-foreground);
        text-decoration: none;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s ease;
      }

      .nav-item:hover {
        background: var(--accent);
        color: var(--foreground);
      }

      .nav-item.active {
        background: color-mix(in oklch, var(--primary) 15%, transparent);
        color: var(--foreground);
        border-inline-start: 3px solid var(--primary);
      }

      .nav-icon {
        flex-shrink: 0;
      }

      .nav-label {
        font-size: 0.875rem;
        font-weight: 500;
      }

      /* Footer */
      .sidebar-footer {
        border-block-start: 1px solid var(--border);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-foreground);
        flex-shrink: 0;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--foreground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        color: var(--muted-foreground);
        text-transform: capitalize;
      }

      .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        color: var(--muted-foreground);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        justify-content: center;
      }

      .logout-btn:hover {
        background: color-mix(in oklch, var(--destructive) 10%, transparent);
        border-color: color-mix(in oklch, var(--destructive) 30%, transparent);
        color: var(--destructive);
      }
    `,
  ],
})
export class Sidebar {
  readonly authService = inject(AuthService);

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
