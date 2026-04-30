import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InstitucionesService } from './instituciones.service';
import { Institucion } from '../../schemas/institucion.schema';
import { environment } from '../../../environments/environment';

describe('InstitucionesService', () => {
  let service: InstitucionesService;
  let httpMock: HttpTestingController;

  const mockInstitucion: Institucion = {
    id: 1,
    nombre: 'Universidad Nacional',
    descripcion: 'Institución de educación superior',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstitucionesService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(InstitucionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all instituciones', () => {
    service.getAll().subscribe(response => {
      expect(response.data).toEqual(mockInstitucion);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/instituciones`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockInstitucion });
  });

  it('should get institucion by id', () => {
    service.getById(1).subscribe(response => {
      expect(response.data).toEqual(mockInstitucion);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/instituciones/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockInstitucion });
  });

  it('should create institucion', () => {
    const institucionData = {
      nombre: 'Instituto Técnico',
      descripcion: 'Institución de formación técnica'
    };

    service.create(institucionData).subscribe(response => {
      expect(response.data).toEqual({ ...institucionData, id: 2 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/instituciones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(institucionData);
    req.flush({ data: { ...institucionData, id: 2 } });
  });

  it('should update institucion', () => {
    const institucionData = {
      nombre: 'Universidad Nacional Mejorada',
      descripcion: 'Descripción actualizada'
    };

    service.update(1, institucionData).subscribe(response => {
      expect(response.data).toEqual({ ...institucionData, id: 1 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/instituciones/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(institucionData);
    req.flush({ data: { ...institucionData, id: 1 } });
  });

  it('should delete institucion', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/instituciones/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});