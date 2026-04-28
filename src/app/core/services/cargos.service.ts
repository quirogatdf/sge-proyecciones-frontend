import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo } from '../../schemas/cargo.schema';
import { environment } from '../../../environments/environment';

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
  private readonly baseUrl = `${environment.apiUrl}/api`;

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getAll(): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(this.getApiUrl('cargos'));
  }

  getById(id: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.getApiUrl('cargos')}/${id}`);
  }

  create(data: { codigo: string; nombre: string; descripcion?: string | null }): Observable<CargoResponse> {
    return this.http.post<CargoResponse>(this.getApiUrl('cargos'), data);
  }

  update(id: number, data: { codigo: string; nombre: string; descripcion?: string | null }): Observable<CargoResponse> {
    return this.http.put<CargoResponse>(`${this.getApiUrl('cargos')}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl('cargos')}/${id}`);
  }
}
