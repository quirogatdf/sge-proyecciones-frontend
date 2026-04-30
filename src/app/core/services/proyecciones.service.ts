import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proyeccion } from '../../shared/models/proyeccion';
import { environment } from '../../../environments/environment';

// Re-exportar el tipo para que las páginas puedan importarlo
export type { Proyeccion };

export interface ProyeccionResponse {
  data: Proyeccion | Proyeccion[];
  message?: string;
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

  getAll(): Observable<ProyeccionResponse> {
    const nivelId = this.selectedNivelId();
    
    if (nivelId) {
      return this.http.get<ProyeccionResponse>(this.getApiUrl(`proyecciones/nivel/${nivelId}`));
    }
    
    return this.http.get<ProyeccionResponse>(this.getApiUrl('proyecciones'));
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
}
