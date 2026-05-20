import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FuncionesService } from './funciones.service';
import { FuncionSchema } from '../../schemas/funcion.schema';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('FuncionesService Integration (Realist Mocks)', () => {
  let service: FuncionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FuncionesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FuncionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all funciones with realistic mock data', async () => {
    const mockResponse = {
      data: [
        { id: 1, nombre: 'Profesor', sigla: 'PROF', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, nombre: 'Preceptor', sigla: 'PREC', created_at: '2024-01-02', updated_at: '2024-01-02' },
      ],
    };

    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as any[]).length).toBe(2);
    
    // Validate Zod schema for each item
    (result?.data as any[]).forEach(funcion => {
      expect(() => FuncionSchema.parse(funcion)).not.toThrow();
    });
  });

  it('should fetch funcion by id with realistic data', async () => {
    const mockResponse = {
      data: { id: 1, nombre: 'Profesor', sigla: 'PROF', created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.getById(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).id).toBe(1);
    expect((result?.data as any).nombre).toBe('Profesor');
    
    // Validate Zod schema
    expect(() => FuncionSchema.parse(result?.data)).not.toThrow();
  });

  it('should create funcion with realistic mock', async () => {
    const newData = { nombre: 'Función Test', sigla: 'FT' };
    const mockResponse = {
      data: { id: 99, ...newData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.create(newData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Función Test');
    expect((result?.data as any).id).toBe(99);
  });

  it('should update funcion with realistic mock', async () => {
    const updateData = { nombre: 'Función Actualizada', sigla: 'FA' };
    const mockResponse = {
      data: { id: 1, ...updateData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.update(1, updateData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Función Actualizada');
  });

  it('should delete funcion', async () => {
    const promise = firstValueFrom(service.delete(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should handle HTTP error gracefully', async () => {
    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/funciones');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
