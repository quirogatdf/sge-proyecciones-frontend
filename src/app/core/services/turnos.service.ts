import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Turno } from '../../schemas/turno.schema';

// Re-exportar el tipo para que las páginas puedan importarlo del servicio
export type { Turno };

export interface TurnoResponse {
  data: Turno | Turno[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/turnos';

  getAll(): Observable<TurnoResponse> {
    return this.http.get<TurnoResponse>(this.apiUrl);
  }

  getById(id: number): Observable<TurnoResponse> {
    return this.http.get<TurnoResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<TurnoResponse> {
    return this.http.post<TurnoResponse>(this.apiUrl, data);
  }

  update(id: number, data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<TurnoResponse> {
    return this.http.put<TurnoResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}