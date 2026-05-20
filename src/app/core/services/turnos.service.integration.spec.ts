import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TurnosService } from './turnos.service';
import { TurnoSchema } from '../../schemas/turno.schema';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('TurnosService Integration (Realist Mocks)', () => {
  let service: TurnosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TurnosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TurnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all turnos with realistic mock data', async () => {
    const mockResponse = {
      data: [
        { id: 1, nombre: 'Turno Matutino', sigla: 'TM', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, nombre: 'Turno Vespertino', sigla: 'TV', created_at: '2024-01-02', updated_at: '2024-01-02' },
      ],
    };

    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as any[]).length).toBe(2);
    
    // Validate Zod schema for each item
    (result?.data as any[]).forEach(turno => {
      expect(() => TurnoSchema.parse(turno)).not.toThrow();
    });
  });

  it('should fetch turno by id with realistic data', async () => {
    const mockResponse = {
      data: { id: 1, nombre: 'Turno Matutino', sigla: 'TM', created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.getById(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).id).toBe(1);
    expect((result?.data as any).nombre).toBe('Turno Matutino');
    
    // Validate Zod schema
    expect(() => TurnoSchema.parse(result?.data)).not.toThrow();
  });

  it('should create turno with realistic mock', async () => {
    const newData = { nombre: 'Turno Test', sigla: 'TT' };
    const mockResponse = {
      data: { id: 99, ...newData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.create(newData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Turno Test');
    expect((result?.data as any).id).toBe(99);
  });

  it('should update turno with realistic mock', async () => {
    const updateData = { nombre: 'Turno Actualizado', sigla: 'TA' };
    const mockResponse = {
      data: { id: 1, ...updateData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.update(1, updateData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Turno Actualizado');
  });

  it('should delete turno', async () => {
    const promise = firstValueFrom(service.delete(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should handle HTTP error gracefully', async () => {
    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/turnos');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
