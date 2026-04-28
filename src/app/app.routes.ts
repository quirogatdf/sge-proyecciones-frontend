import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'niveles',
    loadComponent: () => import('./features/niveles/niveles.page').then(m => m.NivelesPage),
  },
  {
    path: 'instituciones',
    loadComponent: () => import('./features/instituciones/instituciones.page').then(m => m.InstitucionesPage),
  },
  {
    path: 'cargos',
    loadComponent: () => import('./features/cargos/cargos.page').then(m => m.CargosPage),
  },
  {
    path: 'turnos',
    loadComponent: () => import('./features/turnos/turnos.page').then(m => m.TurnosPage),
  },
  {
    path: 'funciones',
    loadComponent: () => import('./features/funciones/funciones.page').then(m => m.FuncionesPage),
  },
  {
    path: '',
    redirectTo: 'niveles',
    pathMatch: 'full',
  },
];
