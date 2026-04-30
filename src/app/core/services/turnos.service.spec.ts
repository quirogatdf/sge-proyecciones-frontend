import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TurnosService } from './turnos.service';
import { Turno } from '../../schemas/turno.schema';
import { environment } from '../../../environments/environment';

describe('TurnosService', () => {
  let service: TurnosService;
  let httpMock: HttpTestingController;

  const mockTurno: Turno = {
    id: 1,
    fecha: '2024-01-15',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    descripcion: 'Turno matutino',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TurnosService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(TurnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all turnos', () => {
    service.getAll().subscribe(response => {
      expect(response.data).toEqual(mockTurno);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/turnos`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTurno });
  });

  it('should get turno by id', () => {
    service.getById(1).subscribe(response => {
      expect(response.data).toEqual(mockTurno);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/turnos/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTurno });
  });

  it('should create turno', () => {
    const turnoData = {
      fecha: '2024-01-16',
      hora_inicio: '13:00',
      hora_fin: '17:00',
      descripcion: 'Turno vespertino'
    };

    service.create(turnoData).subscribe(response => {
      expect(response.data).toEqual({ ...turnoData, id: 2 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/turnos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(turnoData);
    req.flush({ data: { ...turnoData, id: 2 } });
  });

  it('should update turno', () => {
    const turnoData = {
      fecha: '2024-01-15',
      hora_inicio: '08:00',
      hora_fin: '12:00',
      descripcion: 'Turno matutino actualizado'
    };

    service.update(1, turnoData).subscribe(response => {
      expect(response.data).toEqual({ ...turnoData, id: 1 });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/turnos/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(turnoData);
    req.flush({ data: { ...turnoData, id: 1 } });
  });

  it('should delete turno', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/turnos/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});