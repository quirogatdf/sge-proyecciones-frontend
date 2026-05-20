import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FuncionesService } from './funciones.service';
import { Funcion } from '../../schemas/funcion.schema';
import { environment } from '../../../environments/environment';

describe('FuncionesService', () => {
  let service: FuncionesService;
  let httpMock: HttpTestingController;

  const mockFuncion: Funcion = {
    id: 1,
    nombre: 'Planificación',
    descripcion: 'Función de planificación estratégica',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FuncionesService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(FuncionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all funciones', () => {
    service.getAll().subscribe(response => {
      expect(response.data).toEqual(mockFuncion);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/funciones`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockFuncion });
  });

  it('should get funcion by id', () => {
    service.getById(1).subscribe(response => {
      expect(response.data).toEqual(mockFuncion);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/funciones/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockFuncion });
  });

  it('should create funcion', () => {
    const funcionData = {
      nombre: 'Ejecución',
      descripcion: 'Función de ejecución operativa'
    };

    service.create(funcionData).subscribe(response => {
      expect(response.data).toEqual({ ...funcionData, id: 2 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/funciones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(funcionData);
    req.flush({ data: { ...funcionData, id: 2 } });
  });

  it('should update funcion', () => {
    const funcionData = {
      nombre: 'Planificación Estratégica',
      descripcion: 'Descripción actualizada'
    };

    service.update(1, funcionData).subscribe(response => {
      expect(response.data).toEqual({ ...funcionData, id: 1 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/funciones/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(funcionData);
    req.flush({ data: { ...funcionData, id: 1 } });
  });

  it('should delete funcion', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/funciones/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});