import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { AgregarInstrumentoDialogComponent } from './agregar-instrumento-dialog.component';
import { ProyeccionesService } from '../../core/services/proyecciones.service';
import { AlertService } from '../../core/services/alert.service';
import { CargosService } from '../../core/services/cargos.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { TurnosService } from '../../core/services/turnos.service';
import { ResolucionesService } from '../../core/services/resoluciones.service';
import { Proyeccion } from '../../shared/models/proyeccion';
import { ProyeccionInstrumento } from '../../core/services/proyecciones.service';

describe('AgregarInstrumentoDialogComponent — crear en blanco', () => {
  let fixture: ComponentFixture<AgregarInstrumentoDialogComponent>;
  let component: AgregarInstrumentoDialogComponent;

  const proyeccion: Proyeccion = {
    id: 1,
    id_nivel: 1,
    id_institucion: 1,
    id_puesto: 'IN-001',
    anio: '2025',
    año: '2025',
    estado: 'Autorizado',
    motivo: 'Creación',
    n_expediente: 'EXP-2025',
    orden: '1',
    horar: 40,
    cargos: 1,
    id_cargo: 2,
    id_funcion: 3,
    id_turno: 4,
    fecha_desde: '2025-03-01',
    fecha_hasta: '2025-12-31',
    id_resolucion: 5,
    resolucion_ministerial: 'RES-2025',
    resolucion_ministerial_ext: 'EXT-2025',
    disposicion_sgnij: 'DIS-2025',
    rect_disposoco_sgnij: null,
    resolucion_previa_continuidad: null,
    resolucion_ministerial_rect1: null,
    resolucion_ministerial_rect2: null,
    destino_anterior: 'DEST-ANT-2025',
    destino_nuevo: 'DEST-NUEVO-2025',
  };

  const snapshot2026: ProyeccionInstrumento = {
    id: 10,
    proyeccion_id: 1,
    anio: '2026',
    estado: 'Autorizado',
    motivo: 'Creación',
    n_expediente: 'EXP-2026',
    orden: 1,
    horar: 40,
    cargos: 1,
    id_cargo: 2,
    id_funcion: 3,
    id_turno: 4,
    fecha_desde: '2026-03-01',
    fecha_hasta: '2026-12-31',
    id_resolucion: 5,
    resolucion_ministerial: 'RES-2026',
    resolucion_ministerial_ext: 'EXT-2026',
    disposicion_sgnij: 'DIS-2026',
    rect_disposoco_sgnij: null,
    resolucion_previa_continuidad: null,
    resolucion_ministerial_rect1: null,
    resolucion_ministerial_rect2: null,
    destino_anterior: 'DEST-ANT-2026',
    destino_nuevo: 'DEST-NUEVO-2026',
    observaciones: 'snapshot 2026',
  } as ProyeccionInstrumento;

  const proyeccionesServiceMock = {
    createInstrumento: vi.fn(),
    updateInstrumento: vi.fn(),
  };
  const alertServiceMock = { success: vi.fn(), error: vi.fn() };
  const cargosServiceMock = { getAll: vi.fn() };
  const funcionesServiceMock = { getAll: vi.fn() };
  const turnosServiceMock = { getAll: vi.fn() };
  const resolucionesServiceMock = { getAll: vi.fn() };

  beforeEach(async () => {
    cargosServiceMock.getAll.mockReturnValue(of({ data: [] }));
    funcionesServiceMock.getAll.mockReturnValue(of({ data: [] }));
    turnosServiceMock.getAll.mockReturnValue(of({ data: [] }));
    resolucionesServiceMock.getAll.mockReturnValue(of({ data: [] }));

    await TestBed.configureTestingModule({
      imports: [AgregarInstrumentoDialogComponent],
      providers: [
        { provide: ProyeccionesService, useValue: proyeccionesServiceMock },
        { provide: AlertService, useValue: alertServiceMock },
        { provide: CargosService, useValue: cargosServiceMock },
        { provide: FuncionesService, useValue: funcionesServiceMock },
        { provide: TurnosService, useValue: turnosServiceMock },
        { provide: ResolucionesService, useValue: resolucionesServiceMock },
      ],
    }).compileComponents();
  });

  function createFixture() {
    fixture = TestBed.createComponent(AgregarInstrumentoDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('proyeccion', proyeccion);
    fixture.componentRef.setInput('instrumentos', [snapshot2026]);
    fixture.componentRef.setInput('editando', null);
    fixture.detectChanges();
  }

  function radioNuevo(): DebugElement {
    return fixture.debugElement.query(By.css('input[type="radio"][value="nuevo"]'));
  }

  it('valida que al abrir, modo por defecto es copiar_anterior y el form viene lleno', () => {
    createFixture();
    expect(component.modo()).toBe('copiar_anterior');
    // El snapshot 2026 llena los campos
    expect(component.form.estado).toBe('Autorizado');
    expect(component.form.n_expediente).toBe('EXP-2026');
    expect(component.form.id_cargo).toBe(2);
  });

  it('al hacer click en "Crear en blanco" vacía el formulario', () => {
    createFixture();
    const radio = radioNuevo();
    expect(radio).toBeTruthy();

    radio.nativeElement.click();
    fixture.detectChanges();

    expect(component.modo()).toBe('nuevo');
    expect(component.form.anio).toBe('');
    expect(component.form.estado).toBeNull();
    expect(component.form.motivo).toBeNull();
    expect(component.form.n_expediente).toBeNull();
    expect(component.form.orden).toBeNull();
    expect(component.form.horar).toBeNull();
    expect(component.form.cargos).toBeNull();
    expect(component.form.id_cargo).toBeNull();
    expect(component.form.id_funcion).toBeNull();
    expect(component.form.id_turno).toBeNull();
    expect(component.form.fecha_desde).toBeNull();
    expect(component.form.fecha_hasta).toBeNull();
    expect(component.form.id_resolucion).toBeNull();
    expect(component.form.resolucion_ministerial_ext).toBeNull();
    expect(component.form.disposicion_sgnij).toBeNull();
    expect(component.form.rect_disposoco_sgnij).toBeNull();
    expect(component.form.resolucion_previa_continuidad).toBeNull();
    expect(component.form.resolucion_ministerial_rect1).toBeNull();
    expect(component.form.resolucion_ministerial_rect2).toBeNull();
    expect(component.form.destino_anterior).toBeNull();
    expect(component.form.destino_nuevo).toBeNull();
    expect(component.form.observaciones).toBeNull();
  });

  it('el radio "Crear en blanco" queda checked después del click', () => {
    createFixture();
    radioNuevo().nativeElement.click();
    fixture.detectChanges();

    const radio = radioNuevo();
    expect((radio.nativeElement as HTMLInputElement).checked).toBe(true);
    expect(component.modo()).toBe('nuevo');
  });

  it('al volver a "Copiar del último año" el form se rellena con el snapshot 2026', () => {
    createFixture();
    radioNuevo().nativeElement.click();
    fixture.detectChanges();

    const radioCopiar = fixture.debugElement.query(
      By.css('input[type="radio"][value="copiar_anterior"]')
    );
    radioCopiar.nativeElement.click();
    fixture.detectChanges();

    expect(component.modo()).toBe('copiar_anterior');
    expect(component.form.anio).toBe('2027');
    expect(component.form.estado).toBe('Autorizado');
    expect(component.form.n_expediente).toBe('EXP-2026');
  });

  it('al volver a "Copiar del último año", el radio checked es copiar_anterior', () => {
    createFixture();
    radioNuevo().nativeElement.click();
    fixture.detectChanges();

    const radioCopiar = fixture.debugElement.query(
      By.css('input[type="radio"][value="copiar_anterior"]')
    );
    radioCopiar.nativeElement.click();
    fixture.detectChanges();

    expect(
      (radioCopiar.nativeElement as HTMLInputElement).checked
    ).toBe(true);
  });
});