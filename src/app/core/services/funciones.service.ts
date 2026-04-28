import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Funcion } from '../../schemas/funcion.schema';
import { environment } from '../../../environments/environment';

// Re-exportar el tipo para que las páginas puedan importarlo del servicio
export type { Funcion };

export interface FuncionResponse {
  data: Funcion | Funcion[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<FuncionResponse> {
    return this.http.get<FuncionResponse>(this.getApiUrl('funciones'));
  }

  getById(id: number): Observable<FuncionResponse> {
    return this.http.get<FuncionResponse>(`${this.getApiUrl('funciones')}/${id}`);
  }

  create(data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<FuncionResponse> {
    return this.http.post<FuncionResponse>(this.getApiUrl('funciones'), data);
  }

  update(id: number, data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<FuncionResponse> {
    return this.http.put<FuncionResponse>(`${this.getApiUrl('funciones')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('funciones')}/${id}`);
  }
}