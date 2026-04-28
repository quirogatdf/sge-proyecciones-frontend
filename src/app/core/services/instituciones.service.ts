import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Institucion } from '../../schemas/institucion.schema';

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
  private readonly apiUrl = 'http://localhost:8000/api/instituciones';

  getAll(): Observable<InstitucionResponse> {
    return this.http.get<InstitucionResponse>(this.apiUrl);
  }

  getById(id: number): Observable<InstitucionResponse> {
    return this.http.get<InstitucionResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: { 
    nombre: string; 
    localidad: string; 
    nivel_id: number; 
    cuise?: string | null;
    anexo?: string | null 
  }): Observable<InstitucionResponse> {
    return this.http.post<InstitucionResponse>(this.apiUrl, data);
  }

  update(id: number, data: { 
    nombre: string; 
    localidad: string; 
    nivel_id: number; 
    cuise?: string | null;
    anexo?: string | null 
  }): Observable<InstitucionResponse> {
    return this.http.put<InstitucionResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
