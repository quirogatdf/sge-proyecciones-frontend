import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionesService } from '../../core/services/proyecciones.service';
import { InstitucionesService } from '../../core/services/instituciones.service';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { AlertService } from '../../core/services/alert.service';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';

export interface ExportFilters {
  motivo: 'Continuidad' | 'Creacion' | null;
  id_institucion: number | null;
  id_cargo: number | null;
  anio: string | null;
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-overlay" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Exportar Proyecciones</h2>
            <button class="close-btn" (click)="onCancel()">&times;</button>
          </div>

          <div class="dialog-body">
            <!-- Motivo -->
            <div class="form-group">
              <label for="exportMotivo">Motivo</label>
              <app-searchable-select
                id="exportMotivo"
                [options]="motivosOptions()"
                placeholder="Todos los motivos"
                [(value)]="selectedMotivo"
              />
            </div>

            <!-- Institución -->
            <div class="form-group">
              <label for="exportInstitucion">Institución</label>
              <app-searchable-select
                id="exportInstitucion"
                [options]="institucionesOptions()"
                placeholder="Todas las instituciones"
                [(value)]="selectedInstitucionId"
              />
            </div>

            <!-- Cargo -->
            <div class="form-group">
              <label for="exportCargo">Cargo</label>
              <app-searchable-select
                id="exportCargo"
                [options]="cargosOptions()"
                placeholder="Todos los cargos"
                [(value)]="selectedCargoId"
              />
            </div>

            <!-- Año -->
            <div class="form-group">
              <label for="exportAnio">Año</label>
              <input
                id="exportAnio"
                type="text"
                maxlength="4"
                placeholder="Todos los años"
                [(ngModel)]="selectedAnio"
              />
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
            <button
              class="btn btn-primary"
              [disabled]="exporting()"
              (click)="onExport()"
            >
              @if (exporting()) {
                <span class="spinner"></span>
                Exportando...
              } @else {
                Exportar
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: var(--background);
      border-radius: var(--radius);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: visible;
    }

    .dialog-body {
      max-height: 60vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: var(--foreground);
    }

    .dialog-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
    }

    .form-group select,
    .form-group input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      cursor: pointer;
    }

    .form-group select:focus,
    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius);
      cursor: pointer;
      transition: background-color 0.15s, opacity 0.15s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--secondary);
      color: var(--secondary-foreground);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--accent);
    }

    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ExportDialogComponent implements OnInit {
  private readonly proyeccionesService = inject(ProyeccionesService);
  private readonly institucionesService = inject(InstitucionesService);
  private readonly cargosService = inject(CargosService);
  private readonly alertService = inject(AlertService);

  isOpen = input.required<boolean>();
  closed = output<void>();
  exportComplete = output<void>();

  selectedMotivo: 'Continuidad' | 'Creacion' | string | null = null;
  selectedInstitucionId: number | null = null;
  selectedCargoId: number | null = null;
  selectedAnio: string = '';

  instituciones = signal<{ id: number; nombre: string }[]>([]);
  cargos = signal<Cargo[]>([]);
  exporting = signal(false);

  readonly motivosOptions = signal<{ id: string | number; label: string }[]>([
    { id: null as unknown as string, label: 'Todos los motivos' },
    { id: 'Creacion', label: 'Creación' },
    { id: 'Continuidad', label: 'Continuidad' },
  ]);

  readonly institucionesOptions = computed(() => [
    { id: null as unknown as number, label: 'Todas las instituciones' },
    ...this.instituciones().map((i) => ({ id: i.id, label: i.nombre })),
  ]);

  readonly cargosOptions = computed(() => [
    { id: null as unknown as number, label: 'Todos los cargos' },
    ...this.cargos().map((c) => ({ id: c.id, label: `${c.codigo} - ${c.nombre}` })),
  ]);

  ngOnInit() {
    this.loadInstituciones();
    this.loadCargos();
  }

  private loadInstituciones() {
    this.institucionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.instituciones.set(
          Array.isArray(data) ? data.map((i: any) => ({ id: i.id, nombre: i.nombre })) : []
        );
      },
      error: () => {},
    });
  }

  private loadCargos() {
    this.cargosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.cargos.set(Array.isArray(data) ? data : [data]);
      },
      error: () => {},
    });
  }

  onCancel() {
    this.closed.emit();
  }

  onExport() {
    this.exporting.set(true);

    const params: {
      motivo?: 'Continuidad' | 'Creacion';
      id_institucion?: number;
      id_cargo?: number;
      anio?: string;
    } = {};

    if (this.selectedMotivo !== null) {
      params.motivo = this.selectedMotivo as 'Continuidad' | 'Creacion';
    }
    if (this.selectedInstitucionId !== null) {
      params.id_institucion = this.selectedInstitucionId;
    }
    if (this.selectedCargoId !== null) {
      params.id_cargo = this.selectedCargoId;
    }
    if (this.selectedAnio.trim()) {
      params.anio = this.selectedAnio.trim();
    }

    this.proyeccionesService.exportExcel(params).subscribe({
      next: (blob) => {
        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        const motivoSuffix = this.selectedMotivo ? `_${this.selectedMotivo.toLowerCase()}` : '_todos';
        link.download = `proyecciones${motivoSuffix}_${timestamp}.xlsx`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.exporting.set(false);
        this.alertService.success('Exportación completada', 'El archivo Excel se ha descargado');
        this.exportComplete.emit();
        this.closed.emit();
      },
      error: (err) => {
        this.exporting.set(false);
        if (err.status === 413) {
          this.alertService.warning(
            'Demasiados registros',
            err.error?.message || 'Use filtros más específicos'
          );
        } else {
          this.alertService.error('Error', 'No se pudo generar el archivo Excel');
        }
      },
    });
  }
}
