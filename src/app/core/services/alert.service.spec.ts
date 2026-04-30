import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;
  let swalSpy: { fire: jasmine.Spy; close: jasmine.Spy; showLoading: jasmine.Spy };

  beforeEach(() => {
    const swalSpyObj = jasmine.createSpyObj('Swal', ['fire', 'close', 'showLoading']);
    
    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: Swal, useValue: swalSpyObj }
      ]
    });
    
    service = TestBed.inject(AlertService);
    swalSpy = TestBed.inject(Swal) as unknown as { fire: jasmine.Spy; close: jasmine.Spy; showLoading: jasmine.Spy };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call success method with correct parameters', () => {
    service.success('Test Title', 'Test Message');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'success',
      title: 'Test Title',
      text: 'Test Message',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  });

  it('should call success method with default parameters', () => {
    service.success();
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'success',
      title: 'Exito',
      text: 'Operacion realizada correctamente',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  });

  it('should call error method with correct parameters', () => {
    service.error('Test Error', 'Something went wrong');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Test Error',
      text: 'Something went wrong'
    });
  });

  it('should call error method with default parameters', () => {
    service.error();
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Error',
      text: 'Algo salio mal'
    });
  });

  it('should call info method with correct parameters', () => {
    service.info('Test Info', 'Informational message');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'info',
      title: 'Test Info',
      text: 'Informational message'
    });
  });

  it('should call warning method with correct parameters', () => {
    service.warning('Test Warning', 'Warning message');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'warning',
      title: 'Test Warning',
      text: 'Warning message'
    });
  });

  it('should call confirm method and return promise', async () => {
    const mockResult = { isConfirmed: true };
    swalSpy.fire.and.resolveTo(mockResult);
    
    const result = await service.confirm('Confirm Title', 'Confirm Message');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'warning',
      title: 'Confirm Title',
      text: 'Confirm Message',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280'
    });
    
    expect(result).toEqual(mockResult);
  });

  it('should call confirm method with default parameters', async () => {
    const mockResult = { isConfirmed: false };
    swalSpy.fire.and.resolveTo(mockResult);
    
    const result = await service.confirm();
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'warning',
      title: '¿Estas seguro?',
      text: 'Esta accion no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280'
    });
    
    expect(result).toEqual(mockResult);
  });

  it('should call loading method with correct parameters', () => {
    service.loading('Loading test');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      title: 'Loading test',
      allowOutsideClick: false,
      didOpen: jasmine.any(Function) as unknown as Function
    });
    
    // Check that didOpen callback was called
    const didOpenCallback = swalSpy.fire.calls.mostRecent().args[0].didOpen;
    didOpenCallback();
    expect(swalSpy.showLoading).toHaveBeenCalled();
  });

  it('should call loading method with default parameters', () => {
    service.loading();
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      title: 'Cargando...',
      allowOutsideClick: false,
      didOpen: jasmine.any(Function) as unknown as Function
    });
  });

  it('should call close method', () => {
    service.close();
    
    expect(swalSpy.close).toHaveBeenCalled();
  });

  it('should call toast method with correct parameters', () => {
    service.toast('success', 'Test Toast', 1500);
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'success',
      title: 'Test Toast',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  });

  it('should call toast method with default timer', () => {
    service.toast('error', 'Test Toast Error');
    
    expect(swalSpy.fire).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Test Toast Error',
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  });
});