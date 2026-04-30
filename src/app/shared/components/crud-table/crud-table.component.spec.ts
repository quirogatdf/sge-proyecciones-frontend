import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { CrudTableComponent } from './crud-table.component';
import { ColumnConfig, CrudTableConfig } from '../../interfaces/crud-config.interface';

// Mock service
const mockService = {
  getAll: vi.fn(),
  delete: vi.fn(),
};

// Mock AlertService
const mockAlertService = {
  confirm: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

// Test data
interface TestEntity {
  id: number;
  nombre: string;
  codigo: string;
}

const testData: TestEntity[] = [
  { id: 1, nombre: 'Test 1', codigo: 'T1' },
  { id: 2, nombre: 'Test 2', codigo: 'T2' },
  { id: 3, nombre: 'Test 3', codigo: 'T3' },
];

describe('CrudTableComponent', () => {
  let component: CrudTableComponent<TestEntity>;

  const config: CrudTableConfig<TestEntity> = {
    title: 'Test Entities',
    pageSize: 2,
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'nombre', label: 'Nombre', sortable: true },
      { key: 'codigo', label: 'Código', sortable: false },
    ],
    searchFields: ['nombre', 'codigo'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    TestBed.configureTestingModule({
      imports: [CrudTableComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CrudTableComponent<TestEntity>);
    component = fixture.componentInstance;
    
    // Setup inputs
    component.config = config;
    component.service = mockService;
    component.saving = signal(false);
    
    // Mock getAll to return test data
    mockService.getAll.mockReturnValue({
      subscribe: (callbacks: any) => {
        callbacks.next({ data: testData });
        return { unsubscribe: vi.fn() };
      },
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    expect(mockService.getAll).toHaveBeenCalled();
    expect(component.items().length).toBe(3);
  });

  it('should filter items by search term', () => {
    component.onSearch('Test 1');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].nombre).toBe('Test 1');
  });

  it('should sort items by column', () => {
    component.onSort('nombre');
    expect(component.sortBy()).toBe('nombre');
    expect(component.sortDirection()).toBe('asc');
    
    // Toggle direction
    component.onSort('nombre');
    expect(component.sortDirection()).toBe('desc');
  });

  it('should paginate items correctly', () => {
    expect(component.totalPages()).toBe(2); // 3 items, pageSize=2
    expect(component.paginatedItems().length).toBe(2);
    
    component.onPageChange(2);
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedItems().length).toBe(1);
  });

  it('should not change page if out of bounds', () => {
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
    
    component.onPageChange(10);
    expect(component.currentPage()).toBe(1);
  });

  it('should reset to page 1 when searching', () => {
    component.onPageChange(2);
    expect(component.currentPage()).toBe(2);
    
    component.onSearch('test');
    expect(component.currentPage()).toBe(1);
  });

  it('should open modal for new item', () => {
    const modalSpy = vi.spyOn(component.modalOpened, 'emit');
    
    component.openModal();
    
    expect(component.showModal()).toBe(true);
    expect(component.editingItem()).toBeNull();
    expect(modalSpy).toHaveBeenCalledWith(null);
  });

  it('should open modal for editing item', () => {
    const modalSpy = vi.spyOn(component.modalOpened, 'emit');
    const item = testData[0];
    
    component.openModal(item);
    
    expect(component.showModal()).toBe(true);
    expect(component.editingItem()).toEqual(item);
    expect(modalSpy).toHaveBeenCalledWith(item);
  });

  it('should close modal', () => {
    component.showModal.set(true);
    component.editingItem.set(testData[0]);
    
    component.closeModal();
    
    expect(component.showModal()).toBe(false);
    expect(component.editingItem()).toBeNull();
  });

  it('should get correct cell values', () => {
    const item = testData[0];
    const col: ColumnConfig<TestEntity> = { key: 'nombre', label: 'Nombre' };
    
    expect(component.getCellValue(item, col)).toBe('Test 1');
  });

  it('should use render function if provided', () => {
    const item = testData[0];
    const col: ColumnConfig<TestEntity> = { 
      key: 'nombre', 
      label: 'Nombre',
      render: (item) => `Custom: ${item.nombre}`
    };
    
    expect(component.getCellValue(item, col)).toBe('Custom: Test 1');
  });

  it('should return - for null values', () => {
    const item = { id: 1, nombre: null as any, codigo: 'T1' };
    const col: ColumnConfig<TestEntity> = { key: 'nombre' as any, label: 'Nombre' };
    
    expect(component.getCellValue(item as any, col)).toBe('-');
  });

  it('should get correct sort icon', () => {
    expect(component.getSortIcon('nombre' as any)).toBe('↕️');
    
    component.sortBy.set('nombre' as any);
    expect(component.getSortIcon('nombre' as any)).toBe('↑');
    
    component.sortDirection.set('desc');
    expect(component.getSortIcon('nombre' as any)).toBe('↓');
  });

  it('should get correct entity name from config title', () => {
    component.config = { ...config, title: 'Administrar Funciones/Perfiles' };
    expect(component.getEntityName()).toBe('Función/Perfil');
    
    component.config = { ...config, title: 'Administrar Cargos' };
    expect(component.getEntityName()).toBe('Cargo');
  });
});
