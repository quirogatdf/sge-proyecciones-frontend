import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resolucion } from '../../schemas/resolucion.schema';
import { environment } from '../../../environments/environment';

export type { Resolucion };

export interface ResolucionResponse {
  data: Resolucion | Resolucion[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResolucionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<ResolucionResponse> {
    return this.http.get<ResolucionResponse>(this.getApiUrl('resoluciones'));
  }

  getById(id: number): Observable<ResolucionResponse> {
    return this.http.get<ResolucionResponse>(`${this.getApiUrl('resoluciones')}/${id}`);
  }

  create(data: {
    nombre: string;
    año: number;
    observacion?: string | null;
    url?: string | null;
  }): Observable<ResolucionResponse> {
    return this.http.post<ResolucionResponse>(this.getApiUrl('resoluciones'), data);
  }

  update(id: number, data: {
    nombre: string;
    año: number;
    observacion?: string | null;
    url?: string | null;
  }): Observable<ResolucionResponse> {
    return this.http.put<ResolucionResponse>(`${this.getApiUrl('resoluciones')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('resoluciones')}/${id}`);
  }
}
