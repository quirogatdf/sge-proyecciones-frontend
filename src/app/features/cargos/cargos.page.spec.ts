import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CargosPage } from './cargos.page';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { AlertService } from '../../core/services/alert.service';
import { CargoFormSchema } from '../../schemas/cargo.schema';

const mockCargo: Cargo = {
  id: 1,
  codigo: '100',
  nombre: 'Supervisor',
  descripcion: 'Cargo de supervisión',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockCargosService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockAlertService = {
  confirm: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

describe('CargosPage', () => {
  let component: CargosPage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    TestBed.configureTestingModule({
      providers: [
        CargosPage,
        { provide: CargosService, useValue: mockCargosService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    });
    
    component = TestBed.inject(CargosPage);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct table config', () => {
    expect(component.tableConfig.title).toBe('Administrar Cargos');
    expect(component.tableConfig.pageSize).toBe(25);
    expect(component.tableConfig.columns.length).toBe(4);
  });

  it('should initialize form data for new cargo', () => {
    component.onModalOpened(null);
    
    expect(component.editingCargo()).toBeNull();
    expect(component.formData.codigo).toBe('');
    expect(component.formData.nombre).toBe('');
    expect(component.formData.descripcion).toBe('');
  });

  it('should initialize form data for editing cargo', () => {
    component.onModalOpened(mockCargo);
    
    expect(component.editingCargo()).toEqual(mockCargo);
    expect(component.formData.codigo).toBe('100');
    expect(component.formData.nombre).toBe('Supervisor');
  });

  it('should validate form data - success', () => {
    component.onModalOpened(null);
    component.formData = {
      codigo: '200',
      nombre: 'Nuevo Cargo',
      descripcion: 'Descripción',
    };
    
    const result = CargoFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(true);
  });

  it('should validate form data - missing required fields', () => {
    component.onModalOpened(null);
    component.formData = {
      codigo: '',
      nombre: '',
      descripcion: '',
    };
    
    const result = CargoFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(false);
  });

  it('should handle save for new cargo', () => {
    component.onModalOpened(null);
    component.formData = {
      codigo: '300',
      nombre: 'Otro Cargo',
      descripcion: 'Test',
    };
    
    mockCargosService.create.mockReturnValue({
      subscribe: (callbacks: any) => {
        callbacks.next({ data: { ...component.formData, id: 2 } });
        return { unsubscribe: vi.fn() };
      },
    });
    
    component.onSave();
    
    expect(mockCargosService.create).toHaveBeenCalled();
  });

  it('should handle field errors', () => {
    component.submitted.set(true);
    component.formErrors.set({ codigo: ['El código es obligatorio'] });
    
    expect(component.hasFieldError('codigo')).toBe(true);
    expect(component.hasFieldError('nombre')).toBe(false);
  });
});
