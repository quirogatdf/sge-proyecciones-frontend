import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proyeccion } from '../../shared/models/proyeccion';
import { environment } from '../../../environments/environment';

// Re-exportar el tipo para que las páginas puedan importarlo
export type { Proyeccion };

export interface ProyeccionResponse {
  data: Proyeccion | Proyeccion[];
  message?: string;
}

export interface PaginatedProyeccionResponse {
  data: Proyeccion[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ProyeccionQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  id_nivel?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProyeccionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;
  
  // Estado interno para el filtro de nivel
  selectedNivelId = signal<number | null>(null);

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(params?: ProyeccionQueryParams): Observable<PaginatedProyeccionResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.id_nivel) httpParams = httpParams.set('id_nivel', params.id_nivel.toString());
    
    return this.http.get<PaginatedProyeccionResponse>(
      this.getApiUrl('proyecciones'),
      { params: httpParams }
    );
  }

  setNivelFiltro(nivelId: number | null): void {
    this.selectedNivelId.set(nivelId);
  }

  getById(id: number): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(`${this.getApiUrl('proyecciones')}/${id}`);
  }

  create(proyeccion: Partial<Proyeccion>): Observable<ProyeccionResponse> {
    return this.http.post<ProyeccionResponse>(this.getApiUrl('proyecciones'), proyeccion);
  }

  update(id: number, proyeccion: Partial<Proyeccion>): Observable<ProyeccionResponse> {
    return this.http.put<ProyeccionResponse>(`${this.getApiUrl('proyecciones')}/${id}`, proyeccion);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('proyecciones')}/${id}`);
  }

  /**
   * Get proyecciones filtered by institucion ID
   */
  getByInstitucion(institucionId: string | number): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(
      `${this.getApiUrl('proyecciones')}?institucion_id=${institucionId}`
    );
  }

  /**
   * Get all proyecciones without pagination (for dashboard aggregation)
   * This loads ALL records - use only for dashboard charts that need full data
   */
  getAllForDashboard(): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(
      this.getApiUrl('proyecciones?per_page=9999')
    );
  }

  /**
   * Get all proyecciones with nivel relationship eager loaded
   * Used for dashboard chart: cargos by nivel
   */
  getAllWithNivel(): Observable<ProyeccionResponse> {
    return this.http.get<ProyeccionResponse>(
      `${this.getApiUrl('proyecciones')}?include=nivel`
    );
  }
}
