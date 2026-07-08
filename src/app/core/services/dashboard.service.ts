import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProyeccionesService } from './proyecciones.service';
import { InstitucionesService } from './instituciones.service';
import { CargosByYear, CargosByNivel, HorasByYear, HorasByNivel, Institucion, Instituciones, StatsByInstitucion } from '../schemas/dashboard.schema';
import { ProyeccionResponse } from './proyecciones.service';
import { environment } from '../../../environments/environment';

// Re-export types for use in components
export type { CargosByYear, CargosByNivel, HorasByYear, HorasByNivel, Institucion, Instituciones, StatsByInstitucion };

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
    return this.proyeccionesService.getAllForDashboard().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter by institucion if provided, and only tipo 'C'
        const institucionIdNum = institucionId ? parseInt(institucionId) : null;
        
        const filteredProyecciones = proyecciones
          .filter(p => p.cargo?.tipo === 'C')
          .filter(p => institucionIdNum ? p.id_institucion === institucionIdNum : true);
        
        // Group by year (año) and count proyecciones
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const year = p.año;
          // Skip entries without a valid year
          if (!year || year === '0' || year.trim() === '') {
            return acc;
          }
          // Count 1 per proyeccion
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
   * Get cargos count by nivel (solo tipo 'C'), optionally filtered by year
   * Aggregates data from Proyeccion table client-side
   */
  getCargosByNivel(anio: string = ''): Observable<{ data: CargosByNivel }> {
    return this.proyeccionesService.getAllForDashboard().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter only tipo 'C' and optionally by year
        const filteredProyecciones = proyecciones
          .filter(p => p.cargo?.tipo === 'C')
          .filter(p => anio ? p.año === anio : true);
        
        // Group by nivel.nombre and count proyecciones
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const nivelName = p.nivel?.nombre || 'Sin nivel';
          // Count 1 per proyeccion
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
   * Get total horas by year (solo tipo 'H'), optionally filtered by institution
   * Aggregates data from Proyeccion table client-side
   */
  getHorasByYear(institucionId: string): Observable<{ data: HorasByYear }> {
    return this.proyeccionesService.getAllForDashboard().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter by institucion if provided, and only tipo 'H'
        const institucionIdNum = institucionId ? parseInt(institucionId) : null;
        
        const filteredProyecciones = proyecciones
          .filter(p => p.cargo?.tipo === 'H')
          .filter(p => institucionIdNum ? p.id_institucion === institucionIdNum : true);
        
        // Group by year (año) and sum horar
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const year = p.año;
          // Skip entries without a valid year
          if (!year || year === '0' || year.trim() === '') {
            return acc;
          }
          // Sum horar (default to 0 if null/undefined)
          acc[year] = (acc[year] || 0) + (p.horar ?? 0);
          return acc;
        }, {});
        
        // Convert to chart format, sorted by year
        const data: HorasByYear = Object.entries(grouped)
          .map(([year, totalHoras]) => ({
            year: parseInt(year),
            totalHoras,
          }))
          .filter(item => !isNaN(item.year) && item.year > 0)
          .sort((a, b) => a.year - b.year);
        
        return { data };
      })
    );
  }

  /**
   * Get total horas by nivel (solo tipo 'H'), optionally filtered by year
   * Aggregates data from Proyeccion table client-side
   */
  getHorasByNivel(anio: string = ''): Observable<{ data: HorasByNivel }> {
    return this.proyeccionesService.getAllForDashboard().pipe(
      map((response: ProyeccionResponse) => {
        const proyecciones = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        // Filter only tipo 'H' and optionally by year
        const filteredProyecciones = proyecciones
          .filter(p => p.cargo?.tipo === 'H')
          .filter(p => anio ? p.año === anio : true);
        
        // Group by nivel.nombre and sum horar
        const grouped = filteredProyecciones.reduce<Record<string, number>>((acc, p) => {
          const nivelName = p.nivel?.nombre || 'Sin nivel';
          // Sum horar (default to 0 if null/undefined)
          acc[nivelName] = (acc[nivelName] || 0) + (p.horar ?? 0);
          return acc;
        }, {});
        
        // Convert to chart format
        const data: HorasByNivel = Object.entries(grouped)
          .map(([nivel_nombre, totalHoras]) => ({
            nivel_nombre,
            totalHoras,
          }))
          .sort((a, b) => b.totalHoras - a.totalHoras); // Sort by totalHoras descending
        
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
            cuise: i.cuise || null,
          }))
        };
      })
    );
  }
}
