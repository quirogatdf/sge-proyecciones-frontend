import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProyeccionesService } from './proyecciones.service';
import { InstitucionesService } from './instituciones.service';
import { CargosByYear, CargosByNivel, HorasByYear, HorasByNivel, Institucion, Instituciones, StatsByInstitucion } from '../schemas/dashboard.schema';
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
   * Get cargos count by year for a specific institution.
   * La serie histórica se agrega en el backend (stats/por-anio) porque el
   * listado solo expone el año en foco.
   */
  getCargosByYear(institucionId: string): Observable<{ data: CargosByYear }> {
    return this.getStatsPorAnio(institucionId).pipe(
      map((res) => ({
        data: (res.data?.cargos ?? []) as CargosByYear,
      })),
    );
  }

  /**
   * Get cargos count by nivel (solo tipo 'C'), filtered by year.
   * Pide el listado del año pedido al backend (que filtra el JOIN por anio)
   * y agrupa por nivel.
   */
  getCargosByNivel(anio: string = ''): Observable<{ data: CargosByNivel }> {
    return this.proyeccionesService.getAll({ per_page: 9999, anio: anio || undefined }).pipe(
      map((response) => {
        const proyecciones = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Filter only tipo 'C' (el cargo viene cargado en el instrumento en foco)
        const filteredProyecciones = proyecciones.filter((p) => p.cargo?.tipo === 'C');

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
   * Get total horas by year (solo tipo 'H'), optionally filtered by institution.
   * La serie histórica se agrega en el backend (stats/por-anio).
   */
  getHorasByYear(institucionId: string): Observable<{ data: HorasByYear }> {
    return this.getStatsPorAnio(institucionId).pipe(
      map((res) => ({
        data: (res.data?.horas ?? []) as HorasByYear,
      })),
    );
  }

  /**
   * Get total horas by nivel (solo tipo 'H'), filtered by year.
   * Pide el listado del año pedido al backend y agrupa por nivel.
   */
  getHorasByNivel(anio: string = ''): Observable<{ data: HorasByNivel }> {
    return this.proyeccionesService.getAll({ per_page: 9999, anio: anio || undefined }).pipe(
      map((response) => {
        const proyecciones = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Filter only tipo 'H'
        const filteredProyecciones = proyecciones.filter((p) => p.cargo?.tipo === 'H');

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
   * Serie histórica cargos/horas por año, agregada por el backend.
   */
  private getStatsPorAnio(institucionId: string): Observable<{ data?: { cargos?: CargosByYear; horas?: HorasByYear } }> {
    const params = new URLSearchParams();
    if (institucionId) params.set('institucion_id', institucionId);
    const qs = params.toString();

    return this.http.get<{ data?: { cargos?: CargosByYear; horas?: HorasByYear } }>(
      `${this.baseUrl}/proyecciones/stats/por-anio${qs ? '?' + qs : ''}`
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
