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
 * Interfaz que debe implementar el servicio CRUD para client-side
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
 * Interfaz para servicios con paginación server-side
 */
export interface ServerSideCrudService<T> {
  getAll(params: {
    page?: number;
    per_page?: number;
    search?: string;
    [key: string]: unknown;
  }): { subscribe: (callbacks: {
    next: (res: { data: T[]; meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    } }) => void;
    error?: (err: unknown) => void;
  }) => void };
  delete(id: number): { subscribe: (callbacks: {
    next: () => void;
    error?: (err: unknown) => void;
  }) => void };
}

/**
 * Opción del selector "Buscar en". El origen y el tipo son informativos: los
 * envía el endpoint de descubrimiento del backend y el frontend no los usa.
 */
export interface SearchFieldOption {
  /** Clave pública del campo. El frontend nunca envía nombres de columna. */
  key: string;
  label: string;
  origen?: 'plaza' | 'instrumento' | 'relacion' | null;
  tipo?: 'texto' | 'numero' | 'fecha' | 'enum' | null;
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
  /** Mostrar acción de ver detalle (default: false) */
  showViewDetail?: boolean;
  /** Usar paginación y búsqueda server-side (default: false) */
  serverSide?: boolean;
  /** Texto del botón para crear (default: 'Nuevo'). Ej: 'Nueva Proyección'. */
  createButtonLabel?: string;
  /** Título del modal para crear (default: 'Nuevo {entity}'). Ej: 'Nueva Proyección'. */
  createTitle?: string;
  /** Título del modal para editar (default: 'Editar {entity}'). Ej: 'Editar Proyección'. */
  editTitle?: string;
  /**
   * Nombre del query param del campo de búsqueda (default: 'search_field').
   *
   * Las OPCIONES del selector no van acá: se pasan como input `searchFieldOptions`
   * del CrudTable, porque llegan por HTTP después del mount y un objeto de config
   * plano las capturaría por valor, dejando el picker en `[]`.
   */
  searchFieldParamName?: string;
  /** Debounce del input de búsqueda en ms (default: 350, 0 = sin debounce). */
  searchDebounceMs?: number;
}
