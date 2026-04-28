import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Nivel } from '../../schemas/nivel.schema';

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
  private readonly apiUrl = 'http://localhost:8000/api/niveles';

  getAll(): Observable<NivelResponse> {
    return this.http.get<NivelResponse>(this.apiUrl);
  }

  getById(id: number): Observable<NivelResponse> {
    return this.http.get<NivelResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: { nombre: string; sigla?: string | null }): Observable<NivelResponse> {
    return this.http.post<NivelResponse>(this.apiUrl, data);
  }

  update(id: number, data: { nombre: string; sigla?: string | null }): Observable<NivelResponse> {
    return this.http.put<NivelResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
