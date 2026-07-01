import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DashboardService,
  CargosByYear,
  CargosByNivel,
  HorasByYear,
  HorasByNivel,
  Institucion,
  StatsByInstitucion,
} from '../../core/services/dashboard.service';
import { ProyeccionesService } from '../../core/services/proyecciones.service';
import { CargosByYearChartComponent } from './components/cargos-by-year-chart.component';
import { CargosByNivelChartComponent } from './components/cargos-by-nivel-chart.component';
import { HorasByYearChartComponent } from './components/horas-by-year-chart.component';
import { HorasByNivelChartComponent } from './components/horas-by-nivel-chart.component';
import { ProyeccionesByInstitucionChartComponent } from './components/proyecciones-by-institucion-chart.component';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CargosByYearChartComponent,
    CargosByNivelChartComponent,
    HorasByYearChartComponent,
    HorasByNivelChartComponent,
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

            <!-- Year Selector -->
            <div class="mb-4">
              <label for="cargos-nivel-anio-select" class="block text-sm font-medium mb-2">
                Filtrar por Año
              </label>
              <select
                id="cargos-nivel-anio-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="selectedCargosNivelAnio()"
                (ngModelChange)="selectedCargosNivelAnio.set($event)"
              >
                @for (anio of years(); track anio) {
                  <option [value]="anio">{{ anio }}</option>
                }
              </select>
            </div>

            @if (cargosByNivel().length > 0) {
              <app-cargos-by-nivel-chart [cargosByNivel]="cargosByNivel()" />
            } @else {
              <div class="flex items-center justify-center h-48 text-gray-500">
                <p>No hay datos disponibles para este año</p>
              </div>
            }
          </div>
        </div>

        <!-- Charts 3-4: Horas Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Chart 3: Horas by Year (with institution selector) -->
          <div class="chart-card">
            <h2 class="text-lg font-semibold mb-4">Horas por Año</h2>

            <!-- Institution Selector (inside this card) -->
            <div class="mb-4">
              <label for="horas-institucion-select" class="block text-sm font-medium mb-2">
                Seleccionar Institución
              </label>
              <select
                id="horas-institucion-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="selectedHorasInstitucionId()"
                (ngModelChange)="selectedHorasInstitucionId.set($event || null)"
              >
                <option value="">-- Todas las instituciones --</option>
                @for (inst of instituciones(); track inst.id) {
                  <option [value]="inst.id">{{ inst.nombre }}</option>
                }
              </select>
            </div>

            @if (horasByYear().length > 0) {
              <app-horas-by-year-chart [horasByYear]="horasByYear()" />
            } @else {
              <div class="flex items-center justify-center h-48 text-gray-500">
                <p>No hay datos disponibles para esta institución</p>
              </div>
            }
          </div>

          <!-- Chart 4: Horas by Nivel (with year selector) -->
          <div class="chart-card">
            <h2 class="text-lg font-semibold mb-4">Horas por Nivel</h2>

            <!-- Year Selector -->
            <div class="mb-4">
              <label for="horas-nivel-anio-select" class="block text-sm font-medium mb-2">
                Filtrar por Año
              </label>
              <select
                id="horas-nivel-anio-select"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white"
                [ngModel]="selectedHorasNivelAnio()"
                (ngModelChange)="selectedHorasNivelAnio.set($event)"
              >
                @for (anio of years(); track anio) {
                  <option [value]="anio">{{ anio }}</option>
                }
              </select>
            </div>

            @if (horasByNivel().length > 0) {
              <app-horas-by-nivel-chart [horasByNivel]="horasByNivel()" />
            } @else {
              <div class="flex items-center justify-center h-48 text-gray-500">
                <p>No hay datos disponibles para este año</p>
              </div>
            }
          </div>
        </div>

        <!-- Chart 5: Proyecciones por Institución (full width) -->
        <div class="chart-card">
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
              <label class="block text-sm font-medium mb-2"> Filtrar por Institución </label>
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
  styles: [
    `
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
    `,
  ],
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly proyeccionesService = inject(ProyeccionesService);

  // Signals for state
  readonly instituciones = signal<Institucion[]>([]);
  readonly selectedInstitucionId = signal<string>(''); // Default: empty = all
  readonly cargosByYear = signal<CargosByYear>([]);
  readonly cargosByNivel = signal<CargosByNivel>([]);
  readonly selectedCargosNivelAnio = signal<string>(new Date().getFullYear().toString());
  readonly loading = signal(true);

  // Signals for "Horas" charts
  readonly horasByYear = signal<HorasByYear>([]);
  readonly selectedHorasInstitucionId = signal<string>(''); // Default: empty = all
  readonly horasByNivel = signal<HorasByNivel>([]);
  readonly selectedHorasNivelAnio = signal<string>(new Date().getFullYear().toString());

  // Signals for "Proyecciones por Institución" chart
  readonly years = signal<string[]>([]);
  readonly statsSelectedAnio = signal<string>(''); // Default: empty = all
  readonly statsSelectedInstitucionId = signal<string>(''); // Default: empty = all years
  readonly statsByInstitucion = signal<StatsByInstitucion>([]);

  // Options for the searchable institution select
  readonly statsInstitucionOptions = computed(() =>
    this.instituciones().map((inst) => ({
      id: inst.id,
      label: inst.cuise ? `${inst.nombre}  (${inst.cuise})` : inst.nombre,
    })),
  );

  constructor() {
    // Load initial data
    this.loadInstituciones();
    this.loadCargosByNivel(this.selectedCargosNivelAnio());
    this.loadCargosByYear(''); // Load all by default
    this.loadHorasByYear(''); // Load all by default
    this.loadHorasByNivel(this.selectedHorasNivelAnio());
    this.loadYears();

    // React to institution changes - only affects Cargos by Year
    effect(() => {
      const institucionId = this.selectedInstitucionId() || '';
      this.loadCargosByYear(institucionId);
    });

    // React to year changes for Cargos by Nivel
    effect(() => {
      const anio = this.selectedCargosNivelAnio();
      this.loadCargosByNivel(anio);
    });

    // React to institution changes - only affects Horas by Year
    effect(() => {
      const institucionId = this.selectedHorasInstitucionId() || '';
      this.loadHorasByYear(institucionId);
    });

    // React to year changes for Horas by Nivel
    effect(() => {
      const anio = this.selectedHorasNivelAnio();
      this.loadHorasByNivel(anio);
    });

    // React to año/institution changes for the new chart
    effect(() => {
      const anio = this.statsSelectedAnio();
      const instId = this.statsSelectedInstitucionId() || '';
      this.loadStatsByInstitucion(anio, instId);
    });
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

  private loadCargosByNivel(anio: string): void {
    this.dashboardService.getCargosByNivel(anio).subscribe({
      next: (response) => {
        this.cargosByNivel.set(response.data);
      },
      error: (err: unknown) => {
        console.error('Error loading cargos by nivel:', err);
        this.cargosByNivel.set([]);
      },
    });
  }

  private loadHorasByYear(institucionId: string): void {
    this.dashboardService.getHorasByYear(institucionId).subscribe({
      next: (response) => {
        this.horasByYear.set(response.data);
      },
      error: (err: unknown) => {
        console.error('Error loading horas by year:', err);
        this.horasByYear.set([]);
      },
    });
  }

  private loadHorasByNivel(anio: string): void {
    this.dashboardService.getHorasByNivel(anio).subscribe({
      next: (response) => {
        this.horasByNivel.set(response.data);
      },
      error: (err: unknown) => {
        console.error('Error loading horas by nivel:', err);
        this.horasByNivel.set([]);
      },
    });
  }

  private loadYears(): void {
    // Extract distinct years from all proyecciones
    this.proyeccionesService.getAll().subscribe({
      next: (response) => {
        const proyecciones = Array.isArray(response.data) ? response.data : [response.data];
        const distinctYears = [
          ...new Set(
            proyecciones.map((p) => p.año).filter((y): y is string => !!y && y.trim() !== ''),
          ),
        ];
        this.years.set(distinctYears.sort((a, b) => parseInt(b) - parseInt(a))); // newest first
      },
      error: (err: unknown) => {
        console.error('Error loading years:', err);
      },
    });
  }

  private loadStatsByInstitucion(anio: string = '', institucionId: string = ''): void {
    this.dashboardService.getStatsByInstitucion(anio, institucionId).subscribe({
      next: (response) => {
        this.statsByInstitucion.set(response.data);
      },
      error: (err: unknown) => {
        console.error('Error loading stats by institution:', err);
        this.statsByInstitucion.set([]);
      },
    });
  }
}
