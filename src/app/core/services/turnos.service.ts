import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Turno } from '../../schemas/turno.schema';
import { environment } from '../../../environments/environment';

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
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<TurnoResponse> {
    return this.http.get<TurnoResponse>(this.getApiUrl('turnos'));
  }

  getById(id: number): Observable<TurnoResponse> {
    return this.http.get<TurnoResponse>(`${this.getApiUrl('turnos')}/${id}`);
  }

  create(data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<TurnoResponse> {
    return this.http.post<TurnoResponse>(this.getApiUrl('turnos'), data);
  }

  update(id: number, data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<TurnoResponse> {
    return this.http.put<TurnoResponse>(`${this.getApiUrl('turnos')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('turnos')}/${id}`);
  }
}