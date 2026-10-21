import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { ProyeccionesListComponent } from './proyecciones-list.component';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { ProyeccionesService } from '../../core/services/proyecciones.service';
import { NivelesService } from '../../core/services/niveles.service';
import { CargosService } from '../../core/services/cargos.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { TurnosService } from '../../core/services/turnos.service';
import { InstitucionesService } from '../../core/services/instituciones.service';
import { ResolucionesService } from '../../core/services/resoluciones.service';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';

const ANIO = new Date().getFullYear().toString();

type Params = Record<string, unknown>;

function getAllLlamadas(servicio: { getAll: ReturnType<typeof vi.fn> }): Params[] {
  return servicio.getAll.mock.calls.map((call) => call[0] as Params);
}

function ultimaLlamada(servicio: { getAll: ReturnType<typeof vi.fn> }): Params {
  const llamadas = getAllLlamadas(servicio);
  return llamadas[llamadas.length - 1];
}

describe('ProyeccionesListComponent — filtros y paginación', () => {
  let fixture: ComponentFixture<ProyeccionesListComponent>;
  let component: ProyeccionesListComponent;
  let crudTable: CrudTableComponent<{ id: number }>;

  const proyeccionesServiceMock = {
    getAll: vi.fn((params?: Params) =>
      of({
        data: [],
        meta: {
          current_page: Number(params?.['page'] ?? 1),
          last_page: 5,
          per_page: 25,
          total: 120,
          anio: ANIO,
          anios_disponibles: [ANIO],
        },
      }),
    ),
    getCamposBuscables: vi.fn(() => of({ data: [] })),
    getOpcionesFiltros: vi.fn(() =>
      of({ data: { instituciones: [], cargos: [], resoluciones: [], niveles: [] } }),
    ),
    delete: vi.fn(() => of(undefined)),
  };

  const nivelesServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const cargosServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const funcionesServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const turnosServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const institucionesServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const resolucionesServiceMock = { getAll: vi.fn(() => of({ data: [] })) };
  const alertServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn(() => of(true)),
  };
  const routerMock = { navigate: vi.fn() };
  const authServiceMock = { isAdmin: () => true, getToken: () => null };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ProyeccionesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProyeccionesService, useValue: proyeccionesServiceMock },
        { provide: NivelesService, useValue: nivelesServiceMock },
        { provide: CargosService, useValue: cargosServiceMock },
        { provide: FuncionesService, useValue: funcionesServiceMock },
        { provide: TurnosService, useValue: turnosServiceMock },
        { provide: InstitucionesService, useValue: institucionesServiceMock },
        { provide: ResolucionesService, useValue: resolucionesServiceMock },
        { provide: AlertService, useValue: alertServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProyeccionesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const crudDebug = fixture.debugElement.query(By.directive(CrudTableComponent));
    crudTable = crudDebug.componentInstance as CrudTableComponent<{ id: number }>;
  });

  it('envía el año por defecto en la carga inicial', () => {
    expect(proyeccionesServiceMock.getAll).toHaveBeenCalled();

    expect(ultimaLlamada(proyeccionesServiceMock)).toMatchObject({
      page: 1,
      per_page: 25,
      anio: ANIO,
    });
  });

  it('applyFilters combina los 3 filtros y vuelve a la página 1', () => {
    crudTable.onPageChange(2);
    expect(ultimaLlamada(proyeccionesServiceMock)['page']).toBe(2);

    component.selectedNivelId.set(1);
    component.selectedResolucionId.set(7);
    component.selectedLocalidad.set('Ushuaia');
    component.applyFilters();
    fixture.detectChanges();

    expect(ultimaLlamada(proyeccionesServiceMock)).toMatchObject({
      page: 1,
      id_nivel: 1,
      id_resolucion: 7,
      localidad: 'Ushuaia',
      anio: ANIO,
    });
  });

  it('Siguiente conserva los filtros y NO resetea a la página 1 (regresión)', () => {
    component.selectedNivelId.set(1);
    component.applyFilters();
    fixture.detectChanges();

    const llamadasAntes = proyeccionesServiceMock.getAll.mock.calls.length;

    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button.btn-page',
    );
    const siguiente = Array.from(botones).find(
      (boton) => boton.textContent?.trim() === 'Siguiente',
    );
    expect(siguiente).toBeTruthy();

    siguiente!.click();
    fixture.detectChanges();

    const llamadasNuevas = getAllLlamadas(proyeccionesServiceMock).slice(llamadasAntes);

    expect(crudTable.currentPage()).toBe(2);
    expect(llamadasNuevas).toHaveLength(1);
    expect(llamadasNuevas[0]).toMatchObject({ page: 2, id_nivel: 1 });
    expect(llamadasNuevas.some((llamada) => llamada['page'] === 1)).toBe(false);
  });
});
