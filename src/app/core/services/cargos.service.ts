import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo } from '../../schemas/cargo.schema';

// Re-exportar el tipo para que las páginas puedan importarlo del servicio
export type { Cargo };

export interface CargoResponse {
  data: Cargo | Cargo[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CargosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/cargos';

  getAll(): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(this.apiUrl);
  }

  getById(id: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: { codigo: string; nombre: string; descripcion?: string | null }): Observable<CargoResponse> {
    return this.http.post<CargoResponse>(this.apiUrl, data);
  }

  update(id: number, data: { codigo: string; nombre: string; descripcion?: string | null }): Observable<CargoResponse> {
    return this.http.put<CargoResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
