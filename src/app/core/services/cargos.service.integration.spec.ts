import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CargosService } from './cargos.service';
import { CargoSchema } from '../../schemas/cargo.schema';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('CargosService Integration (Realist Mocks)', () => {
  let service: CargosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CargosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CargosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all cargos with realistic mock data', async () => {
    const mockResponse = {
      data: [
        { id: 1, codigo: 'DOC', nombre: 'Docente', descripcion: 'Cargo docente', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, codigo: 'AUX', nombre: 'Auxiliar', descripcion: 'Cargo auxiliar', created_at: '2024-01-02', updated_at: '2024-01-02' },
      ],
    };

    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as any[]).length).toBe(2);
    
    // Validate Zod schema for each item
    (result?.data as any[]).forEach(cargo => {
      expect(() => CargoSchema.parse(cargo)).not.toThrow();
    });
  });

  it('should fetch cargo by id with realistic data', async () => {
    const mockResponse = {
      data: { id: 1, codigo: 'DOC', nombre: 'Docente', descripcion: 'Cargo docente', created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.getById(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).id).toBe(1);
    expect((result?.data as any).codigo).toBe('DOC');
    
    // Validate Zod schema
    expect(() => CargoSchema.parse(result?.data)).not.toThrow();
  });

  it('should create cargo with realistic mock', async () => {
    const newData = { codigo: 'TEST', nombre: 'Cargo Test', descripcion: 'Test desc' };
    const mockResponse = {
      data: { id: 99, ...newData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.create(newData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).codigo).toBe('TEST');
    expect((result?.data as any).id).toBe(99);
  });

  it('should update cargo with realistic mock', async () => {
    const updateData = { codigo: 'UPD', nombre: 'Cargo Actualizado', descripcion: 'Updated' };
    const mockResponse = {
      data: { id: 1, ...updateData, created_at: '2024-01-01', updated_at: '2024-01-01' },
    };

    const promise = firstValueFrom(service.update(1, updateData));
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);

    const result = await promise;
    expect(result?.data).toBeDefined();
    expect((result?.data as any).codigo).toBe('UPD');
  });

  it('should delete cargo', async () => {
    const promise = firstValueFrom(service.delete(1));
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should handle HTTP error gracefully', async () => {
    const promise = firstValueFrom(service.getAll());
    
    const req = httpMock.expectOne('http://localhost:8000/api/cargos');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
