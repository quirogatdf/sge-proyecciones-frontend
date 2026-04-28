import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Funcion } from '../../schemas/funcion.schema';

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
  private readonly apiUrl = 'http://localhost:8000/api/funciones';

  getAll(): Observable<FuncionResponse> {
    return this.http.get<FuncionResponse>(this.apiUrl);
  }

  getById(id: number): Observable<FuncionResponse> {
    return this.http.get<FuncionResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<FuncionResponse> {
    return this.http.post<FuncionResponse>(this.apiUrl, data);
  }

  update(id: number, data: { 
    nombre: string; 
    sigla?: string | null
  }): Observable<FuncionResponse> {
    return this.http.put<FuncionResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}