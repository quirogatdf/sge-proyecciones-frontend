import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideLayoutGrid, LucideBuilding2, LucideBriefcase, LucideClock, LucideUserSquare } from '@lucide/angular';

interface NavItem {
  label: string;
  route: string;
  icon: typeof LucideLayoutGrid;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideLayoutGrid, LucideBuilding2, LucideBriefcase, LucideClock, LucideUserSquare],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-text">SGE - Proyecciones</span>
      </div>

      <nav class="nav">
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
        <a routerLink="/funciones" routerLinkActive="active" class="nav-item">
          <svg lucideUserSquare [size]="20" class="nav-icon"></svg>
          <span class="nav-label">Funcion/Perfil</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [
    `
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
    `,
  ],
})
export class Sidebar {}
