import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, CargosByYear, CargosByNivel, Institucion, StatsByInstitucion } from '../../core/services/dashboard.service';
import { ProyeccionesService, ProyeccionResponse } from '../../core/services/proyecciones.service';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { CargosByYearChartComponent } from './components/cargos-by-year-chart.component';
import { CargosByNivelChartComponent } from './components/cargos-by-nivel-chart.component';
import { ProyeccionesByInstitucionChartComponent } from './components/proyecciones-by-institucion-chart.component';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CargosByYearChartComponent,
    CargosByNivelChartComponent,
    ProyeccionesByInstitucionChartComponent,
    SearchableSelectComponent,
  ],
  template: `
    <div class="dashboard-container p-6 max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Mi escritorio</h1>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <p class="text-gray-500">Cargando datos...</p>
        </div>
      }

      <!-- Charts Grid -->
      @if (!loading()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Chart 1: Cargos by Year (with institution selector) -->
          <div class="chart-card">
            <h2 class="text-lg font-semibold mb-4">Cargos por Año</h2>
            
            <!-- Institution Selector (inside this card) -->
            <div class="mb-4">
              <label for="institucion-select" class="block text-sm font-medium mb-2">
                Seleccionar Institución
              </label>
              <select
                id="institucion-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="selectedInstitucionId()"
                (ngModelChange)="selectedInstitucionId.set($event || null)"
              >
                <option value="">-- Todas las instituciones --</option>
                @for (inst of instituciones(); track inst.id) {
                  <option [value]="inst.id">{{ inst.nombre }}</option>
                }
              </select>
            </div>

            @if (cargosByYear().length > 0) {
              <app-cargos-by-year-chart [cargosByYear]="cargosByYear()" />
            } @else {
              <div class="flex items-center justify-center h-48 text-gray-500">
                <p>No hay datos disponibles para esta institución</p>
              </div>
            }
          </div>

          <!-- Chart 2: Cargos by Nivel (bar chart) -->
          <div class="chart-card">
            <h2 class="text-lg font-semibold mb-4">Cargos por Nivel</h2>
            
            <!-- Nivel Selector (inside this card) -->
            <div class="mb-4">
              <label for="nivel-select" class="block text-sm font-medium mb-2">
                Seleccionar Nivel
              </label>
              <select
                id="nivel-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="selectedNivelId()"
                (ngModelChange)="selectedNivelId.set($event || null)"
              >
                <option value="">-- Todos los niveles --</option>
                @for (nivel of niveles(); track nivel.id) {
                  <option [value]="nivel.id">{{ nivel.nombre }}</option>
                }
              </select>
            </div>

            @if (cargosByNivel().length > 0) {
              <app-cargos-by-nivel-chart [cargosByNivel]="cargosByNivel()" />
            } @else {
              <div class="flex items-center justify-center h-48 text-gray-500">
                <p>No hay datos disponibles para este nivel</p>
              </div>
            }
          </div>
        </div>

        <!-- Chart 3: Proyecciones por Institución (full width) -->
        <div class="chart-card mt-6">
          <h2 class="text-lg font-semibold mb-4">Proyecciones por Institución</h2>

          <!-- Filtros -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="stats-anio-select" class="block text-sm font-medium mb-2">
                Filtrar por Año
              </label>
              <select
                id="stats-anio-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="statsSelectedAnio()"
                (ngModelChange)="statsSelectedAnio.set($event)"
              >
                <option value="">-- Todos los años --</option>
                @for (anio of years(); track anio) {
                  <option [value]="anio">{{ anio }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Filtrar por Institución
              </label>
              <app-searchable-select
                [options]="statsInstitucionOptions()"
                placeholder="Buscar institución por nombre o CUISE..."
                [(value)]="statsSelectedInstitucionId"
              />
            </div>
          </div>

          @if (statsByInstitucion().length > 0) {
            <app-proyecciones-by-institucion-chart [stats]="statsByInstitucion()" />
          } @else {
            <div class="flex items-center justify-center h-48 text-gray-500">
              <p>No hay datos disponibles para los filtros seleccionados</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dashboard-container {
      min-height: 100vh;
    }

    .chart-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }
  `],
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly proyeccionesService = inject(ProyeccionesService);
  private readonly nivelesService = inject(NivelesService);

  // Signals for state
  readonly instituciones = signal<Institucion[]>([]);
  readonly selectedInstitucionId = signal<string>(''); // Default: empty = all
  readonly niveles = signal<Nivel[]>([]);
  readonly selectedNivelId = signal<string>(''); // Default: empty = all
  readonly cargosByYear = signal<CargosByYear>([]);
  readonly cargosByNivel = signal<CargosByNivel>([]);
  readonly loading = signal(true);

  // Signals for "Proyecciones por Institución" chart
  readonly years = signal<string[]>([]);
  readonly statsSelectedAnio = signal<string>(''); // Default: empty = all
  readonly statsSelectedInstitucionId = signal<string>(''); // Default: empty = all years
  readonly statsByInstitucion = signal<StatsByInstitucion>([]);
  readonly statsLoading = signal(false);
  readonly statsYearsLoading = signal(false);

  // Options for the searchable institution select
  readonly statsInstitucionOptions = computed(() =>
    this.instituciones().map(inst => ({
      id: inst.id,
      label: inst.cuise ? `${inst.nombre}  (${inst.cuise})` : inst.nombre,
    }))
  );

  constructor() {
    // Load initial data
    this.loadInstituciones();
    this.loadNiveles();
    this.loadCargosByNivel('');
    this.loadCargosByYear(''); // Load all by default
    this.loadYears();

    // React to institution changes - only affects Cargos by Year
    effect(() => {
      const institucionId = this.selectedInstitucionId() || '';
      this.loadCargosByYear(institucionId);
    });

    // React to nivel changes - only affects Cargos by Nivel
    effect(() => {
      const nivelId = this.selectedNivelId() || '';
      this.loadCargosByNivel(nivelId);
    });

    // React to año/institution changes for the new chart
    effect(() => {
      const anio = this.statsSelectedAnio();
      const instId = this.statsSelectedInstitucionId() || '';
      this.loadStatsByInstitucion(anio, instId);
    });
  }

  onInstitucionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedInstitucionId.set(select.value);
  }

  onNivelChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedNivelId.set(select.value);
  }

  private loadInstituciones(): void {
    this.dashboardService.getInstituciones().subscribe({
      next: (response) => {
        this.instituciones.set(response.data);

        // Default to first institution for the new chart
        const data = response.data;
        if (data.length > 0 && !this.statsSelectedInstitucionId()) {
          this.statsSelectedInstitucionId.set(data[0].id);
        }
      },
      error: (err: unknown) => {
        console.error('Error loading instituciones:', err);
      },
    });
  }

  private loadNiveles(): void {
    this.nivelesService.getAll().subscribe({
      next: (response) => {
        const niveles = Array.isArray(response.data) ? response.data : [response.data];
        this.niveles.set(niveles);
      },
      error: (err: unknown) => {
        console.error('Error loading niveles:', err);
      },
    });
  }

  private loadCargosByYear(institucionId: string): void {
    this.loading.set(true);
    this.dashboardService.getCargosByYear(institucionId).subscribe({
      next: (response) => {
        this.cargosByYear.set(response.data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading cargos by year:', err);
        this.cargosByYear.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadCargosByNivel(nivelId: string): void {
    this.dashboardService.getCargosByNivel(nivelId).subscribe({
      next: (response) => {
        this.cargosByNivel.set(response.data);
      },
      error: (err: unknown) => {
        console.error('Error loading cargos by nivel:', err);
        this.cargosByNivel.set([]);
      },
    });
  }

  private loadYears(): void {
    this.statsYearsLoading.set(true);
    // Extract distinct years from all proyecciones
    this.proyeccionesService.getAll().subscribe({
      next: (response) => {
        const proyecciones = Array.isArray(response.data) ? response.data : [response.data];
        const distinctYears = [...new Set(proyecciones.map(p => p.año).filter((y): y is string => !!y && y.trim() !== ''))];
        this.years.set(distinctYears.sort((a, b) => parseInt(b) - parseInt(a))); // newest first
        this.statsYearsLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading years:', err);
        this.statsYearsLoading.set(false);
      },
    });
  }

  private loadStatsByInstitucion(anio: string = '', institucionId: string = ''): void {
    this.statsLoading.set(true);
    this.dashboardService.getStatsByInstitucion(anio, institucionId).subscribe({
      next: (response) => {
        this.statsByInstitucion.set(response.data);
        this.statsLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading stats by institution:', err);
        this.statsByInstitucion.set([]);
        this.statsLoading.set(false);
      },
    });
  }
}