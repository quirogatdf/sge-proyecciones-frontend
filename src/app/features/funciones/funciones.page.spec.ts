import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FuncionesPage } from './funciones.page';
import { FuncionesService, Funcion } from '../../core/services/funciones.service';
import { AlertService } from '../../core/services/alert.service';
import { FuncionFormSchema } from '../../schemas/funcion.schema';

// Mock data
const mockFuncion: Funcion = {
  id: 1,
  nombre: 'Director',
  sigla: 'DIR',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

// Mock service
const mockFuncionesService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Mock AlertService
const mockAlertService = {
  confirm: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

describe('FuncionesPage', () => {
  let component: FuncionesPage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    TestBed.configureTestingModule({
      providers: [
        FuncionesPage,
        { provide: FuncionesService, useValue: mockFuncionesService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    });
    
    component = TestBed.inject(FuncionesPage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct table config', () => {
    expect(component.tableConfig.title).toBe('Administrar Funciones/Perfiles');
    expect(component.tableConfig.pageSize).toBe(25);
    expect(component.tableConfig.columns.length).toBe(3);
    expect(component.tableConfig.searchFields).toEqual(['nombre', 'sigla']);
  });

  it('should initialize form data correctly for new funcion', () => {
    component.onModalOpened(null);
    
    expect(component.editingFuncion()).toBeNull();
    expect(component.formData.nombre).toBe('');
    expect(component.formData.sigla).toBe('');
    expect(component.submitted()).toBe(false);
    expect(component.formErrors()).toEqual({});
  });

  it('should initialize form data correctly for editing funcion', () => {
    component.onModalOpened(mockFuncion);
    
    expect(component.editingFuncion()).toEqual(mockFuncion);
    expect(component.formData.nombre).toBe('Director');
    expect(component.formData.sigla).toBe('DIR');
  });

  it('should validate form data with Zod schema - success', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: 'Nueva Función',
      sigla: 'NF',
    };
    component.submitted.set(true);
    
    const result = FuncionFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Nueva Función');
      expect(result.data.sigla).toBe('NF');
    }
  });

  it('should validate form data with Zod schema - missing nombre', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: '',
      sigla: 'NF',
    };
    component.submitted.set(true);
    
    const result = FuncionFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten();
      expect(flattened.fieldErrors.nombre).toBeDefined();
    }
  });

  it('should handle save for new funcion', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: 'Nueva Función',
      sigla: 'NF',
    };
    
    // Mock successful creation
    mockFuncionesService.create.mockReturnValue({
      subscribe: (callbacks: any) => {
        callbacks.next({ data: { ...component.formData, id: 2 } });
        return { unsubscribe: vi.fn() };
      },
    });
    
    component.onSave();
    
    expect(mockFuncionesService.create).toHaveBeenCalled();
  });

  it('should handle save for editing funcion', () => {
    component.onModalOpened(mockFuncion);
    component.formData = {
      nombre: 'Director Actualizado',
      sigla: 'DA',
    };
    
    // Mock successful update
    mockFuncionesService.update.mockReturnValue({
      subscribe: (callbacks: any) => {
        callbacks.next({ data: { ...component.formData, id: 1 } });
        return { unsubscribe: vi.fn() };
      },
    });
    
    component.onSave();
    
    expect(mockFuncionesService.update).toHaveBeenCalledWith(1, component.formData);
  });

  it('should not save if validation fails', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: '', // Invalid
      sigla: '',
    };
    component.submitted.set(true);
    
    component.onSave();
    
    expect(mockFuncionesService.create).not.toHaveBeenCalled();
    expect(component.formErrors()['nombre']).toBeDefined();
  });

  it('should handle field errors correctly', () => {
    component.submitted.set(true);
    component.formErrors.set({ nombre: ['El nombre es obligatorio'] });
    
    expect(component.hasFieldError('nombre')).toBe(true);
    expect(component.hasFieldError('sigla')).toBe(false);
  });

  it('should get field errors correctly', () => {
    component.formErrors.set({ nombre: ['Error 1', 'Error 2'] });
    
    expect(component.getFieldErrors('nombre')).toEqual(['Error 1', 'Error 2']);
    expect(component.getFieldErrors('sigla')).toEqual([]);
  });

  it('should clear field error', () => {
    component.formErrors.set({ nombre: ['Error'], sigla: ['Otro error'] });
    
    component.clearFieldError('nombre');
    
    expect(component.formErrors()['nombre']).toBeUndefined();
    expect(component.formErrors()['sigla']).toEqual(['Otro error']);
  });
});
