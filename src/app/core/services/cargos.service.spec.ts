import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CargosService } from './cargos.service';
import { Cargo } from '../../schemas/cargo.schema';
import { environment } from '../../../environments/environment';

describe('CargosService', () => {
  let service: CargosService;
  let httpMock: HttpTestingController;

  const mockCargo: Cargo = {
    id: 1,
    codigo: '100',
    nombre: 'Supervisor',
    descripcion: 'Cargo de supervisión',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CargosService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(CargosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all cargos', () => {
    service.getAll().subscribe(response => {
      expect(response.data).toEqual(mockCargo);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/cargos`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockCargo });
  });

  it('should get cargo by id', () => {
    service.getById(1).subscribe(response => {
      expect(response.data).toEqual(mockCargo);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/cargos/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockCargo });
  });

  it('should create cargo', () => {
    const cargoData = {
      codigo: '200',
      nombre: 'Gerente',
      descripcion: 'Cargo de gerencia'
    };

    service.create(cargoData).subscribe(response => {
      expect(response.data).toEqual({ ...cargoData, id: 2 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/cargos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cargoData);
    req.flush({ data: { ...cargoData, id: 2 } });
  });

  it('should update cargo', () => {
    const cargoData = {
      codigo: '100',
      nombre: 'Supervisor Actualizado',
      descripcion: 'Descripción actualizada'
    };

    service.update(1, cargoData).subscribe(response => {
      expect(response.data).toEqual({ ...cargoData, id: 1 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/cargos/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cargoData);
    req.flush({ data: { ...cargoData, id: 1 } });
  });

  it('should delete cargo', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/cargos/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});