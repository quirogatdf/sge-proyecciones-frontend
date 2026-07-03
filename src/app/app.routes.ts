import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'niveles',
    canActivate: [authGuard],
    loadComponent: () => import('./features/niveles/niveles.page').then((m) => m.NivelesPage),
  },
  {
    path: 'niveles/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/niveles/nivel-detail.component').then((m) => m.NivelDetailComponent),
  },
  {
    path: 'instituciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/instituciones/instituciones.page').then((m) => m.InstitucionesPage),
  },
  {
    path: 'instituciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/instituciones/institucion-detail.component').then(
        (m) => m.InstitucionDetailComponent,
      ),
  },
  {
    path: 'cargos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cargos/cargos.page').then((m) => m.CargosPage),
  },
  {
    path: 'cargos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cargos/cargo-detail.component').then((m) => m.CargoDetailComponent),
  },
  {
    path: 'turnos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/turnos/turnos.page').then((m) => m.TurnosPage),
  },
  {
    path: 'turnos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/turnos/turno-detail.component').then((m) => m.TurnoDetailComponent),
  },
  {
    path: 'resoluciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/resoluciones/resoluciones.page').then((m) => m.ResolucionesPage),
  },
  {
    path: 'resoluciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/resoluciones/resolucion-detail.component').then(
        (m) => m.ResolucionDetailComponent,
      ),
  },
  {
    path: 'funciones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/funciones/funciones.page').then((m) => m.FuncionesPage),
  },
  {
    path: 'funciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/funciones/funcion-detail.component').then((m) => m.FuncionDetailComponent),
  },
  {
    path: 'proyecciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/proyecciones/proyecciones-list.component').then(
        (m) => m.ProyeccionesListComponent,
      ),
  },
  {
    path: 'proyecciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/proyecciones/proyeccion-detail.component').then(
        (m) => m.ProyeccionDetailComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/auth/redirect.component').then((m) => m.RedirectComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
