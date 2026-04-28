import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Institucion } from '../../schemas/institucion.schema';
import { environment } from '../../../environments/environment';

// Re-exportar el tipo para que las páginas puedan importarlo del servicio
export type { Institucion };

export interface InstitucionResponse {
  data: Institucion | Institucion[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstitucionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<InstitucionResponse> {
    return this.http.get<InstitucionResponse>(this.getApiUrl('instituciones'));
  }

  getById(id: number): Observable<InstitucionResponse> {
    return this.http.get<InstitucionResponse>(`${this.getApiUrl('instituciones')}/${id}`);
  }

  create(data: { 
    nombre: string; 
    localidad: string; 
    nivel_id: number; 
    cuise?: string | null;
    anexo?: string | null 
  }): Observable<InstitucionResponse> {
    return this.http.post<InstitucionResponse>(this.getApiUrl('instituciones'), data);
  }

  update(id: number, data: { 
    nombre: string; 
    localidad: string; 
    nivel_id: number; 
    cuise?: string | null;
    anexo?: string | null 
  }): Observable<InstitucionResponse> {
    return this.http.put<InstitucionResponse>(`${this.getApiUrl('instituciones')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('instituciones')}/${id}`);
  }
}
