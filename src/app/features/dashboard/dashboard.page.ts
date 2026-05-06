import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, CargosByYear, CargosByNivel, Institucion } from '../../core/services/dashboard.service';
import { ProyeccionesService, ProyeccionResponse } from '../../core/services/proyecciones.service';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { CargosByYearChartComponent } from './components/cargos-by-year-chart.component';
import { CargosByNivelChartComponent } from './components/cargos-by-nivel-chart.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CargosByYearChartComponent,
    CargosByNivelChartComponent,
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

  constructor() {
    // Load initial data
    this.loadInstituciones();
    this.loadNiveles();
    this.loadCargosByNivel('');
    this.loadCargosByYear(''); // Load all by default

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
}