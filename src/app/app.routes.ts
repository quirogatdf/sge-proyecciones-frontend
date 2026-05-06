import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'niveles',
    loadComponent: () => import('./features/niveles/niveles.page').then((m) => m.NivelesPage),
  },
  {
    path: 'niveles/:id',
    loadComponent: () =>
      import('./features/niveles/nivel-detail.component').then((m) => m.NivelDetailComponent),
  },
  {
    path: 'instituciones',
    loadComponent: () =>
      import('./features/instituciones/instituciones.page').then((m) => m.InstitucionesPage),
  },
  {
    path: 'instituciones/:id',
    loadComponent: () =>
      import('./features/instituciones/institucion-detail.component').then(
        (m) => m.InstitucionDetailComponent,
      ),
  },
  {
    path: 'cargos',
    loadComponent: () => import('./features/cargos/cargos.page').then((m) => m.CargosPage),
  },
  {
    path: 'cargos/:id',
    loadComponent: () =>
      import('./features/cargos/cargo-detail.component').then((m) => m.CargoDetailComponent),
  },
  {
    path: 'turnos',
    loadComponent: () => import('./features/turnos/turnos.page').then((m) => m.TurnosPage),
  },
  {
    path: 'turnos/:id',
    loadComponent: () =>
      import('./features/turnos/turno-detail.component').then((m) => m.TurnoDetailComponent),
  },
  {
    path: 'funciones',
    loadComponent: () => import('./features/funciones/funciones.page').then((m) => m.FuncionesPage),
  },
  {
    path: 'funciones/:id',
    loadComponent: () =>
      import('./features/funciones/funcion-detail.component').then((m) => m.FuncionDetailComponent),
  },
  {
    path: 'proyecciones',
    loadComponent: () =>
      import('./features/proyecciones/proyecciones-list.component').then(
        (m) => m.ProyeccionesListComponent,
      ),
  },
  {
    path: 'proyecciones/:id',
    loadComponent: () =>
      import('./features/proyecciones/proyeccion-detail.component').then(
        (m) => m.ProyeccionDetailComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
