import { Signal } from '@angular/core';

/**
 * Configuración de una columna para la tabla CRUD genérica
 */
export interface ColumnConfig<T = Record<string, unknown>> {
  /** Clave del campo en el objeto de datos */
  key: keyof T & string;
  /** Texto a mostrar en el header */
  label: string;
  /** Si la columna es ordenable (default: true) */
  sortable?: boolean;
  /** Campos a buscar en esta columna (si no se especifica, usa 'key') */
  searchFields?: string[];
  /** Función personalizada para renderizar el valor (opcional) */
  render?: (item: T) => string;
}

/**
 * Interfaz que debe implementar el servicio CRUD
 * Esto asegura que cualquier servicio sea compatible con CrudTableComponent
 */
export interface CrudService<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  getAll(): { subscribe: (callbacks: { 
    next: (res: { data: T | T[] }) => void; 
    error?: (err: unknown) => void 
  }) => void };
  getById?(id: number): { subscribe: (callbacks: { 
    next: (res: { data: T }) => void; 
    error?: (err: unknown) => void 
  }) => void };
  create(data: CreateInput): { subscribe: (callbacks: { 
    next: (res: { data: T }) => void; 
    error?: (err: unknown) => void 
  }) => void };
  update(id: number, data: UpdateInput): { subscribe: (callbacks: { 
    next: (res: { data: T }) => void; 
    error?: (err: unknown) => void 
  }) => void };
  delete(id: number): { subscribe: (callbacks: { 
    next: () => void; 
    error?: (err: unknown) => void 
  }) => void };
}

/**
 * Configuración completa para el componente CRUD
 */
export interface CrudTableConfig<T = Record<string, unknown>> {
  /** Título de la página */
  title: string;
  /** Configuración de columnas */
  columns: ColumnConfig<T>[];
  /** Tamaño de página (default: 25) */
  pageSize?: number;
  /** Campos por los cuales buscar (si no se especifica, usa todas las columnas sortables) */
  searchFields?: (keyof T & string)[];
  /** Placeholder del buscador */
  searchPlaceholder?: string;
}
