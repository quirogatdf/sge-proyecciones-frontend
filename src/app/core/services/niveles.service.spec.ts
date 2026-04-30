import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NivelesService } from './niveles.service';
import { Nivel } from '../../schemas/nivel.schema';
import { environment } from '../../../environments/environment';

describe('NivelesService', () => {
  let service: NivelesService;
  let httpMock: HttpTestingController;

  const mockNivel: Nivel = {
    id: 1,
    nombre: 'Gerencial',
    descripcion: 'Nivel gerencial de la organización',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NivelesService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(NivelesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all niveles', () => {
    service.getAll().subscribe(response => {
      expect(response.data).toEqual(mockNivel);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/niveles`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockNivel });
  });

  it('should get nivel by id', () => {
    service.getById(1).subscribe(response => {
      expect(response.data).toEqual(mockNivel);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/niveles/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockNivel });
  });

  it('should create nivel', () => {
    const nivelData = {
      nombre: 'Operativo',
      descripcion: 'Nivel operativo de la organización'
    };

    service.create(nivelData).subscribe(response => {
      expect(response.data).toEqual({ ...nivelData, id: 2 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/niveles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nivelData);
    req.flush({ data: { ...nivelData, id: 2 } });
  });

  it('should update nivel', () => {
    const nivelData = {
      nombre: 'Gerencial Senior',
      descripcion: 'Descripción actualizada'
    };

    service.update(1, nivelData).subscribe(response => {
      expect(response.data).toEqual({ ...nivelData, id: 1 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/niveles/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(nivelData);
    req.flush({ data: { ...nivelData, id: 1 } });
  });

  it('should delete nivel', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/niveles/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});