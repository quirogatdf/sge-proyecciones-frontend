import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProyeccionesService, Proyeccion } from './proyecciones.service';
import { InstitucionesService } from './instituciones.service';
import { CargosByYear, CargosByNivel, Institucion, Instituciones, StatsByInstitucion } from '../schemas/dashboard.schema';
import { ProyeccionResponse } from './proyecciones.service';
import { environment } from '../../../environments/environment';

// Re-export types for use in components
export type { CargosByYear, CargosByNivel, Institucion, Instituciones, StatsByInstitucion };

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;
  private readonly proyeccionesService = inject(ProyeccionesService);
  private readonly institucionesService = inject(InstitucionesService);

/**
   * Get cargos count by year for a specific institution
   * Aggregates data from Proyeccion table client-side
   * Note: Filters client-side since backend may not support ?institucion_id=X
   */
  getCargosByYear(institucionId: string): Observable<{ data: CargosByYear }> {
    return this.proyeccionesService.getAll().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter by institucion if provided
        const institucionIdNum = institucionId ? parseInt(institucionId) : null;
        
        const filteredProyecciones = institucionIdNum
          ? proyecciones.filter(p => p.id_institucion === institucionIdNum)
          : proyecciones;
        
        // Group by year (año) and count proyecciones (not cargos, since cargos is often empty)
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const year = p.año;
          // Skip entries without a valid year
          if (!year || year === '0' || year.trim() === '') {
            return acc;
          }
          // Count 1 per proyeccion (even if cargos is empty, the proyeccion exists)
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {});
        
        // Convert to chart format, sorted by year
        const data: CargosByYear = Object.entries(grouped)
          .map(([year, count]) => ({
            year: parseInt(year),
            count,
          }))
          .filter(item => !isNaN(item.year) && item.year > 0)
          .sort((a, b) => a.year - b.year);
        
        return { data };
      })
    );
  }

  /**
   * Get cargos count by nivel
   * Aggregates data from Proyeccion table client-side
   * @param nivelId - Optional filter by nivel ID
   */
  getCargosByNivel(nivelId: string): Observable<{ data: CargosByNivel }> {
    return this.proyeccionesService.getAll().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter by nivel if provided
        const nivelIdNum = nivelId ? parseInt(nivelId) : null;
        const filteredProyecciones = nivelIdNum
          ? proyecciones.filter(p => p.id_nivel === nivelIdNum)
          : proyecciones;
        
        // Group by nivel.nombre and count proyecciones (not cargos, since cargos is often empty)
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const nivelName = p.nivel?.nombre || 'Sin nivel';
          // Count 1 per proyeccion (even if cargos is empty, the proyeccion exists)
          acc[nivelName] = (acc[nivelName] || 0) + 1;
          return acc;
        }, {});
        
        // Convert to chart format
        const data: CargosByNivel = Object.entries(grouped)
          .map(([nivel_nombre, count]) => ({
            nivel_nombre,
            count,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending
        
        return { data };
      })
    );
  }

  /**
   * Get proyecciones stats grouped by institution.
   * Optional filters: ?anio=XXXX &institucion_id=X
   */
  getStatsByInstitucion(anio: string = '', institucionId: string = ''): Observable<{ data: StatsByInstitucion }> {
    const params = new URLSearchParams();
    if (anio) params.set('anio', anio);
    if (institucionId) params.set('institucion_id', institucionId);
    const qs = params.toString();

    return this.http.get<{ data: StatsByInstitucion }>(
      `${this.baseUrl}/proyecciones/stats/by-institucion${qs ? '?' + qs : ''}`
    );
  }

  /**
   * Get all instituciones for the selector
   * Uses InstitucionesService
   */
  getInstituciones(): Observable<{ data: Instituciones }> {
    return this.institucionesService.getAll().pipe(
      map((response) => {
        const instituciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        return { 
          data: instituciones.map(i => ({
            id: i.id?.toString() || '',
            nombre: i.nombre || 'Sin nombre',
          }))
        };
      })
    );
  }
}
