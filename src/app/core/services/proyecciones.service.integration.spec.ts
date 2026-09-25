import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProyeccionesService } from './proyecciones.service';
import { PayloadProyeccionInstrumento } from '../../shared/models/proyeccion-instrumento';

describe('ProyeccionesService — instrumentos (Realist Mocks)', () => {
  let service: ProyeccionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProyeccionesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProyeccionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch instrumentos by proyeccion id', async () => {
    const mockResponse = {
      data: [
        { id: 1, proyeccion_id: 7, anio: '2026', orden: 12 },
        { id: 2, proyeccion_id: 7, anio: '2025', orden: 8 },
      ],
    };

    const promise = firstValueFrom(service.getInstrumentos(7));

    const req = httpMock.expectOne('http://localhost:8000/api/proyecciones/7/instrumentos');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(2);
    expect((result.data as any[])[0].anio).toBe('2026');
  });

  it('should create instrumento for a proyeccion', async () => {
    const payload: PayloadProyeccionInstrumento = {
      anio: '2027',
      orden: 12,
      resolucion_ministerial: null,
      id_cargo: 3,
      id_funcion: null,
      id_turno: null,
      horar: 30,
      cargos: 2,
      destino_anterior: 'Juzgado A',
      destino_nuevo: 'Juzgado B',
      observaciones: null,
    };
    const mockResponse = {
      data: { id: 99, proyeccion_id: 7, ...payload },
      message: 'Instrumento agregado correctamente',
    };

    const promise = firstValueFrom(service.createInstrumento(7, payload));

    const req = httpMock.expectOne('http://localhost:8000/api/proyecciones/7/instrumentos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse, { status: 201, statusText: 'Created' });

    const result = await promise;
    expect((result.data as any).id).toBe(99);
    expect((result.data as any).anio).toBe('2027');
  });

  it('should surface validation error on duplicate anio', async () => {
    const payload: PayloadProyeccionInstrumento = { anio: '2026' };

    const promise = firstValueFrom(service.createInstrumento(7, payload));

    const req = httpMock.expectOne('http://localhost:8000/api/proyecciones/7/instrumentos');
    req.flush(
      { message: 'Los datos proporcionados no son válidos.', errors: { anio: ['Ya existe.'] } },
      { status: 422, statusText: 'Unprocessable Entity' }
    );

    let error: any;
    try {
      await promise;
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.status).toBe(422);
    expect(error.error.errors.anio).toContain('Ya existe.');
  });

  it('should delete instrumento for a proyeccion', async () => {
    const promise = firstValueFrom(service.deleteInstrumento(7, 42));

    const req = httpMock.expectOne('http://localhost:8000/api/proyecciones/7/instrumentos/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await promise;
  });
});