import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proyeccion, PayloadProyeccionConInstrumento, PayloadProyeccionPlaza } from '../../shared/models/proyeccion';
import { ProyeccionInstrumento, PayloadProyeccionInstrumento } from '../../shared/models/proyeccion-instrumento';
import { environment } from '../../../environments/environment';
import type { SearchFieldOption } from '../../shared/interfaces/crud-config.interface';

// Re-exportar los tipos para que las páginas puedan importarlos
export type { Proyeccion, ProyeccionInstrumento, PayloadProyeccionConInstrumento, PayloadProyeccionPlaza };

export interface ProyeccionResponse {
  data: Proyeccion | Proyeccion[];
  message?: string;
}

export interface ProyeccionInstrumentoResponse {
  data: ProyeccionInstrumento | ProyeccionInstrumento[];
  message?: string;
}

export interface PaginatedProyeccionResponse {
  data: Proyeccion[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    /** Año en foco del listado (default: último año con instrumentos). */
    anio: string;
    /** Años disponibles en todo el historial, ordenados descendente. */
    anios_disponibles: string[];
  };
}

export interface ProyeccionQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  /**
   * Clave pública del campo por el que se busca. La resuelve el registro del
   * backend; el frontend nunca manda un nombre de columna. Ausente ≡ `__all__`.
   */
  search_field?: string;
  id_nivel?: number | null;
  id_resolucion?: number | null;
  localidad?: string | null;
}

/** Payload de `GET /api/proyecciones/campos-buscables`. */
export interface CamposBuscablesResponse {
  data: SearchFieldOption[];
}

@Injectable({
  providedIn: 'root'
})
export class ProyeccionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(params?: ProyeccionQueryParams & Record<string, unknown>): Observable<PaginatedProyeccionResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search as string);
    // Explícito y no vía el catch-all de abajo: el campo de búsqueda es parte del
    // contrato de búsqueda, no un filtro cualquiera.
    if (params?.search_field) httpParams = httpParams.set('search_field', params.search_field);
    if (params?.id_nivel) httpParams = httpParams.set('id_nivel', (params.id_nivel as number).toString());
    if (params?.['sort_by']) httpParams = httpParams.set('sort_by', params['sort_by'] as string);
    if (params?.['sort_dir']) httpParams = httpParams.set('sort_dir', params['sort_dir'] as string);
    // Forward any additional filter params (e.g. id_resolucion)
    for (const [key, value] of Object.entries(params ?? {})) {
      if (['page','per_page','search','search_field','id_nivel','sort_by','sort_dir'].includes(key)) continue;
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    
    return this.http.get<PaginatedProyeccionResponse>(
      this.getApiUrl('proyecciones'),
      { params: httpParams }
    );
  }

  /**
   * Campos por los que se puede buscar en el listado.
   *
   * Alimenta el picker "Buscar en" del CrudTable. La lista NO se hardcodea en el
   * frontend: el registro del backend es la única fuente de verdad, así que agregar
   * un campo buscable es un cambio de un solo lugar.
   *
   * La primera opción es el sentinel `__all__` (comportamiento heredado).
   */
  getCamposBuscables(): Observable<CamposBuscablesResponse> {
    return this.http.get<CamposBuscablesResponse>(this.getApiUrl('proyecciones/campos-buscables'));
  }

  getById(id: number): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(`${this.getApiUrl('proyecciones')}/${id}`);
  }

  create(proyeccion: PayloadProyeccionConInstrumento): Observable<ProyeccionResponse> {
    return this.http.post<ProyeccionResponse>(this.getApiUrl('proyecciones'), proyeccion);
  }

  update(id: number, proyeccion: PayloadProyeccionPlaza): Observable<ProyeccionResponse> {
    return this.http.put<ProyeccionResponse>(`${this.getApiUrl('proyecciones')}/${id}`, proyeccion);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('proyecciones')}/${id}`);
  }

  /**
   * Historial de instrumentos de una proyección (snapshot por año).
   */
  getInstrumentos(proyeccionId: number): Observable<ProyeccionInstrumentoResponse> {
    return this.http.get<ProyeccionInstrumentoResponse>(
      `${this.getApiUrl('proyecciones')}/${proyeccionId}/instrumentos`
    );
  }

  /**
   * Agregar un instrumento (año nuevo) a una proyección.
   */
  createInstrumento(
    proyeccionId: number,
    payload: PayloadProyeccionInstrumento
  ): Observable<ProyeccionInstrumentoResponse> {
    return this.http.post<ProyeccionInstrumentoResponse>(
      `${this.getApiUrl('proyecciones')}/${proyeccionId}/instrumentos`,
      payload
    );
  }

  /**
   * Editar un instrumento del historial (un año concreto de la proyección).
   * El backend valida que el instrumento pertenezca a la proyección.
   */
  updateInstrumento(
    proyeccionId: number,
    instrumentoId: number,
    payload: PayloadProyeccionInstrumento
  ): Observable<ProyeccionInstrumentoResponse> {
    return this.http.put<ProyeccionInstrumentoResponse>(
      `${this.getApiUrl('proyecciones')}/${proyeccionId}/instrumentos/${instrumentoId}`,
      payload
    );
  }

  /**
   * Eliminar un instrumento del historial.
   * El backend rechaza con 409 si es el último de la proyección.
   */
  deleteInstrumento(
    proyeccionId: number,
    instrumentoId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.getApiUrl('proyecciones')}/${proyeccionId}/instrumentos/${instrumentoId}`
    );
  }

  /**
   * Get proyecciones filtered by institucion ID
   */
  getByInstitucion(institucionId: string | number): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(
      `${this.getApiUrl('proyecciones')}?institucion_id=${institucionId}`
    );
  }

  getOpcionesFiltros(params?: {
    id_resolucion?: number | null;
    id_institucion?: number | null;
    id_nivel?: number | null;
    id_cargo?: number | null;
    motivo?: string | null;
    anio?: string | null;
  }): Observable<{ data: { instituciones: any[]; cargos: any[]; resoluciones: any[]; niveles: any[] } }> {
    let httpParams = new HttpParams();
    if (params?.id_resolucion) httpParams = httpParams.set('id_resolucion', params.id_resolucion.toString());
    if (params?.id_institucion) httpParams = httpParams.set('id_institucion', params.id_institucion.toString());
    if (params?.id_nivel) httpParams = httpParams.set('id_nivel', params.id_nivel.toString());
    if (params?.id_cargo) httpParams = httpParams.set('id_cargo', params.id_cargo.toString());
    if (params?.motivo) httpParams = httpParams.set('motivo', params.motivo);
    if (params?.anio) httpParams = httpParams.set('anio', params.anio);
    return this.http.get<{ data: { instituciones: any[]; cargos: any[]; resoluciones: any[]; niveles: any[] } }>(
      this.getApiUrl('proyecciones/opciones-filtro'),
      { params: httpParams }
    );
  }

  /**
   * Export proyecciones to Excel file.
   * Returns a Blob that should be saved as a download.
   */
  exportExcel(params: {
    motivo?: 'Continuidad' | 'Creacion';
    id_nivel?: number;
    id_institucion?: number;
    id_cargo?: number;
    id_resolucion?: number;
    anio?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.motivo) httpParams = httpParams.set('motivo', params.motivo);
    if (params.id_nivel) httpParams = httpParams.set('id_nivel', params.id_nivel.toString());
    if (params.id_institucion) httpParams = httpParams.set('id_institucion', params.id_institucion.toString());
    if (params.id_cargo) httpParams = httpParams.set('id_cargo', params.id_cargo.toString());
    if (params.id_resolucion) httpParams = httpParams.set('id_resolucion', params.id_resolucion.toString());
    if (params.anio) httpParams = httpParams.set('anio', params.anio);

    return this.http.get(this.getApiUrl('proyecciones/export'), {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
