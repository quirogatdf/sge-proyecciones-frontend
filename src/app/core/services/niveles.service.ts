import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Nivel } from '../../schemas/nivel.schema';
import { environment } from '../../../environments/environment';

// Re-exportar el tipo para que las páginas puedan importarlo del servicio
export type { Nivel };

export interface NivelResponse {
  data: Nivel | Nivel[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NivelesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<NivelResponse> {
    return this.http.get<NivelResponse>(this.getApiUrl('niveles'));
  }

  getById(id: number): Observable<NivelResponse> {
    return this.http.get<NivelResponse>(`${this.getApiUrl('niveles')}/${id}`);
  }

  create(data: { nombre: string; sigla?: string | null }): Observable<NivelResponse> {
    return this.http.post<NivelResponse>(this.getApiUrl('niveles'), data);
  }

  update(id: number, data: { nombre: string; sigla?: string | null }): Observable<NivelResponse> {
    return this.http.put<NivelResponse>(`${this.getApiUrl('niveles')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('niveles')}/${id}`);
  }
}
