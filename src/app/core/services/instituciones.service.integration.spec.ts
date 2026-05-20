import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InstitucionesService } from './instituciones.service';
import { InstitucionSchema } from '../../schemas/institucion.schema';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('InstitucionesService Integration (Realist Mocks)', () => {
  let service: InstitucionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstitucionesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InstitucionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all instituciones with realistic mock data', async () => {
    const mockResponse = {
      data: [
        { 
          id: 1, 
          nombre: 'Escuela N° 1', 
          localidad: 'Rio Grande' as const, 
          nivel_id: 1, 
          cuise: '1234', 
          anexo: null, 
          nivel: { id: 1, nombre: 'Nivel Inicial', sigla: 'NI' },
          created_at: '2024-01-01', 
          updated_at: '2024-01-01' 
        },
        { 
          id: 2, 
          nombre: 'Escuela N° 2', 
          localidad: 'Ushuaia' as const, 
          nivel_id: 2, 
          cuise: '5678', 
          anexo: 'A', 
          nivel: { id: 2, nombre: 'Nivel Primario', sigla: 'NP' },
          created_at: '2024-01-02', 
          updated_at: '2024-01-02' 
        },
      ],
    };

    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as any[]).length).toBe(2);
    
    // Validate Zod schema for each item
    (result?.data as any[]).forEach(institucion => {
      expect(() => InstitucionSchema.parse(institucion)).not.toThrow();
    });
  });

  it('should fetch institucion by id with realistic data', async () => {
    const mockResponse = {
      data: { 
        id: 1, 
        nombre: 'Escuela N° 1', 
        localidad: 'Rio Grande' as const, 
        nivel_id: 1, 
        cuise: '1234', 
        anexo: null, 
        nivel: { id: 1, nombre: 'Nivel Inicial', sigla: 'NI' },
        created_at: '2024-01-01', 
        updated_at: '2024-01-01' 
      },
    };

    const promise = firstValueFrom(service.getById(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).id).toBe(1);
    expect((result?.data as any).nombre).toBe('Escuela N° 1');
    
    // Validate Zod schema
    expect(() => InstitucionSchema.parse(result?.data)).not.toThrow();
  });

  it('should create institucion with realistic mock', async () => {
    const newData = { 
      nombre: 'Institución Test', 
      localidad: 'Rio Grande' as const, 
      nivel_id: 1, 
      cuise: '9999' 
    };
    const mockResponse = {
      data: { ...newData, id: 99, anexo: null, nivel: undefined, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.create(newData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Institución Test');
    expect((result?.data as any).id).toBe(99);
  });

  it('should update institucion with realistic mock', async () => {
    const updateData = { 
      nombre: 'Institución Actualizada', 
      localidad: 'Ushuaia' as const, 
      nivel_id: 2, 
      cuise: '8888' 
    };
    const mockResponse = {
      data: { ...updateData, id: 1, anexo: null, nivel: undefined, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.update(1, updateData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).nombre).toBe('Institución Actualizada');
  });

  it('should delete institucion', async () => {
    const promise = firstValueFrom(service.delete(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should handle HTTP error gracefully', async () => {
    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/instituciones');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
