import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NivelesService } from './niveles.service';
import { NivelSchema } from '../../schemas/nivel.schema';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('NivelesService Integration (Realist Mocks)', () => {
  let service: NivelesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NivelesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NivelesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all niveles with realistic mock data', async () => {
    const mockResponse = {
      data: [
        { id: 1, nombre: 'Nivel Inicial', sigla: 'NI', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, nombre: 'Nivel Primario', sigla: 'NP', created_at: '2024-01-02', updated_at: '2024-01-02' },
      ],
    };

    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as any[]).length).toBe(2);
    
    // Validate Zod schema for each item
    (result?.data as any[]).forEach(nivel => {
      expect(() => NivelSchema.parse(nivel)).not.toThrow();
    });
  });

  it('should fetch nivel by id with realistic data', async () => {
    const mockResponse = {
      data: { id: 1, nombre: 'Nivel Inicial', sigla: 'NI', created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.getById(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).id).toBe(1);
    expect((result?.data as any).nombre).toBe('Nivel Inicial');
    
    // Validate Zod schema
    expect(() => NivelSchema.parse(result?.data)).not.toThrow();
  });

  it('should create nivel with realistic mock', async () => {
    const newData = { nombre: 'Nivel Test', sigla: 'NT' };
    const mockResponse = {
      data: { id: 99, ...newData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.create(newData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Nivel Test');
    expect((result?.data as any).id).toBe(99);
  });

  it('should update nivel with realistic mock', async () => {
    const updateData = { nombre: 'Nivel Actualizado', sigla: 'NA' };
    const mockResponse = {
      data: { id: 1, ...updateData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.update(1, updateData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Nivel Actualizado');
  });

  it('should delete nivel', async () => {
    const promise = firstValueFrom(service.delete(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should handle HTTP error gracefully', async () => {
    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/niveles');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
