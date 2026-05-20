import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NivelesPage } from './niveles.page';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { AlertService } from '../../core/services/alert.service';
import { NivelFormSchema } from '../../schemas/nivel.schema';

const mockNivel: Nivel = {
  id: 1,
  nombre: 'Inicial',
  sigla: 'INI',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockNivelesService = {
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

describe('NivelesPage', () => {
  let component: NivelesPage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    TestBed.configureTestingModule({
      providers: [
        NivelesPage,
        { provide: NivelesService, useValue: mockNivelesService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    });
    
    component = TestBed.inject(NivelesPage);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct table config', () => {
    expect(component.tableConfig.title).toBe('Administrar Niveles');
    expect(component.tableConfig.pageSize).toBe(25);
    expect(component.tableConfig.columns.length).toBe(3);
  });

  it('should initialize form data for new nivel', () => {
    component.onModalOpened(null);
    
    expect(component.editingNivel()).toBeNull();
    expect(component.formData.nombre).toBe('');
    expect(component.formData.sigla).toBe('');
  });

  it('should initialize form data for editing nivel', () => {
    component.onModalOpened(mockNivel);
    
    expect(component.editingNivel()).toEqual(mockNivel);
    expect(component.formData.nombre).toBe('Inicial');
    expect(component.formData.sigla).toBe('INI');
  });

  it('should validate form data - success', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: 'Nuevo Nivel',
      sigla: 'NN',
    };
    
    const result = NivelFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(true);
  });

  it('should validate form data - missing nombre', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: '',
      sigla: '',
    };
    
    const result = NivelFormSchema.safeParse(component.formData);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten();
      expect(flattened.fieldErrors.nombre).toBeDefined();
    }
  });

  it('should handle save for new nivel', () => {
    component.onModalOpened(null);
    component.formData = {
      nombre: 'Nuevo Nivel',
      sigla: 'NN',
    };
    
    mockNivelesService.create.mockReturnValue({
      subscribe: (callbacks: any) => {
        callbacks.next({ data: { ...component.formData, id: 2 } });
        return { unsubscribe: vi.fn() };
      },
    });
    
    component.onSave();
    
    expect(mockNivelesService.create).toHaveBeenCalled();
  });

  it('should handle field errors', () => {
    component.submitted.set(true);
    component.formErrors.set({ nombre: ['El nombre es obligatorio'] });
    
    expect(component.hasFieldError('nombre')).toBe(true);
    expect(component.hasFieldError('sigla')).toBe(false);
  });

  it('should get field errors', () => {
    component.formErrors.set({ nombre: ['Error 1', 'Error 2'] });
    
    expect(component.getFieldErrors('nombre')).toEqual(['Error 1', 'Error 2']);
  });

  it('should clear field error', () => {
    component.formErrors.set({ nombre: ['Error'], sigla: ['Otro error'] });
    
    component.clearFieldError('nombre');
    
    expect(component.formErrors()['nombre']).toBeUndefined();
    expect(component.formErrors()['sigla']).toEqual(['Otro error']);
  });
});
