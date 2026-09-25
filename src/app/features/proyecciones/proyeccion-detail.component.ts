import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionesService, Proyeccion, ProyeccionInstrumento } from '../../core/services/proyecciones.service';
import { AlertService } from '../../core/services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AgregarInstrumentoDialogComponent } from './agregar-instrumento-dialog.component';

@Component({
  selector: 'app-proyeccion-detail',
  standalone: true,
  imports: [CommonModule, AgregarInstrumentoDialogComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-actions">
          <button 
            class="btn btn-secondary" 
            (click)="volverLista()"
          >
            ← Volver a la lista
          </button>
        </div>
        <h1>Detalle de Proyección</h1>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando detalle de proyección...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <p class="error-message">{{ errorMessage() }}</p>
          <button 
            class="btn btn-secondary" 
            (click)="reload()"
          >
            Intentar nuevamente
          </button>
        </div>
      } @else if (!proyeccion()) {
        <div class="empty-container">
          <p>Proyección no encontrada</p>
          <button 
            class="btn btn-secondary" 
            (click)="volverLista()"
          >
            Volver a la lista
          </button>
        </div>
      } @else {
        <div class="detail-content">
          <div class="detail-section">
            <h2>Información Básica</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>ID:</label>
                <span>{{ proyeccion()?.id }}</span>
              </div>
              <div class="detail-item">
                <label>Nivel:</label>
                <span>{{ proyeccion()?.nivel?.nombre || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Estado:</label>
                <span 
                  class="status-badge"
                  [class.status-autorizado]="proyeccion()?.estado === 'Autorizado'"
                  [class.status-rechazado]="proyeccion()?.estado === 'Rechazado'"
                  [class.status-pendiente]="proyeccion()?.estado === 'Pendiente'"
                >
                  {{ proyeccion()?.estado }}
                </span>
              </div>
              <div class="detail-item">
                <label>Motivo:</label>
                <span>{{ proyeccion()?.motivo }}</span>
              </div>
              <div class="detail-item">
                <label>N° Expediente:</label>
                <span>{{ proyeccion()?.n_expediente || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Orden:</label>
                <span>{{ proyeccion()?.orden || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Año:</label>
                <span>{{ proyeccion()?.['año'] || '-' }}</span>
              </div>

              <div class="detail-item">
                <label>ID Puesto:</label>
                <span>{{ proyeccion()?.id_puesto || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Fechas</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Fecha Desde:</label>
                <span>{{ proyeccion()?.fecha_desde }}</span>
              </div>
              <div class="detail-item">
                <label>Fecha Hasta:</label>
                <span>{{ proyeccion()?.fecha_hasta || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Horar:</label>
                <span>{{ proyeccion()?.horar || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Cargos:</label>
                <span>{{ proyeccion()?.cargos || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Relaciones</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Cargo:</label>
                <span>{{ proyeccion()?.cargo?.nombre || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Función:</label>
                <span>{{ proyeccion()?.funcion?.nombre || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Turno:</label>
                <span>{{ proyeccion()?.turno?.nombre || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Institución:</label>
                <span>{{ proyeccion()?.institucion?.nombre || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Destinos</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Destino Anterior:</label>
                <span>{{ proyeccion()?.destino_anterior || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Destino Nuevo:</label>
                <span>{{ proyeccion()?.destino_nuevo || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Resoluciones y Disposiciones</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Resolución Ministerial:</label>
                <span>{{ proyeccion()?.resolucion?.nombre || proyeccion()?.resolucion_ministerial || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Resolución Ministerial Ext:</label>
                <span>{{ proyeccion()?.resolucion_ministerial_ext || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Disposición SGNIJ:</label>
                <span>{{ proyeccion()?.disposicion_sgnij || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Rectificación Disposición SGNIJ:</label>
                <span>{{ proyeccion()?.rect_disposoco_sgnij || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Resolución Previa Continuidad:</label>
                <span>{{ proyeccion()?.resolucion_previa_continuidad || '-' }}</span>
              </div>

              <div class="detail-item">
                <label>Resolución Ministerial Rect. 1:</label>
                <span>{{ proyeccion()?.resolucion_ministerial_rect1 || '-' }}</span>
              </div>

              <div class="detail-item">
                <label>Resolución Ministerial Rect. 2:</label>
                <span>{{ proyeccion()?.resolucion_ministerial_rect2 || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-header">
              <h2>Historial de Instrumentos</h2>
            </div>

            @if (loadingInstrumentos()) {
              <p class="muted-text">Cargando historial...</p>
            } @else {
              <div class="table-wrapper">
                <table class="historial-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>Instrumento legal</th>
                      <th>Cargo</th>
                      <th>Función</th>
                      <th>Turno</th>
                      <th>Horas</th>
                      <th>Cargos</th>
                      <th>Destino anterior</th>
                      <th>Destino nuevo</th>
                      <th>Observaciones</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inst of instrumentos(); track inst.id) {
                      <tr>
                        <td class="anio-cell">{{ inst.anio }}</td>
                        <td>
                          <div class="instrumento-legal">
                            <span>{{ inst.resolucion?.nombre || inst.resolucion_ministerial || '-' }}</span>
                            @if (inst.orden) {
                              <small>Orden {{ inst.orden }}</small>
                            }
                          </div>
                        </td>
                        <td>{{ inst.cargo?.nombre || '-' }}</td>
                        <td>{{ inst.funcion?.nombre || '-' }}</td>
                        <td>{{ inst.turno?.nombre || '-' }}</td>
                        <td>{{ inst.horar ?? '-' }}</td>
                        <td>{{ inst.cargos ?? '-' }}</td>
                        <td>{{ inst.destino_anterior || '-' }}</td>
                        <td>{{ inst.destino_nuevo || '-' }}</td>
                        <td>{{ inst.observaciones || '-' }}</td>
                        <td class="actions-cell">
                          @if (inst.resolucion?.url) {
                            <a
                              class="pdf-link"
                              [href]="inst.resolucion!.url!"
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir PDF de la resolución"
                            >
                              PDF
                            </a>
                          } @else {
                            <span class="muted-text">-</span>
                          }
                          <button
                            class="btn-edit"
                            (click)="editarInstrumento(inst)"
                            title="Editar instrumento del año {{ inst.anio }}"
                          >
                            ✎ Editar
                          </button>
                          <button
                            class="btn-delete"
                            (click)="eliminarInstrumento(inst)"
                            [disabled]="instrumentos().length <= 1"
                            [title]="instrumentos().length <= 1 ? 'No se puede eliminar el único instrumento de la proyección' : 'Eliminar instrumento del año ' + inst.anio"
                          >
                            🗑 Eliminar
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="11" class="empty-row">
                          Sin historial todavía — agregá el primer año desde "Editar" en el listado.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>

        <app-agregar-instrumento-dialog
          [isOpen]="dialogOpen()"
          [proyeccion]="proyeccion()"
          [instrumentos]="instrumentos()"
          [editando]="editandoInstrumento()"
          (closed)="cerrarDialogo()"
          (saved)="onInstrumentosSaved()"
        />
      }
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading-container,
    .error-container,
    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .loading-spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      color: var(--destructive);
      margin-bottom: 1.5rem;
    }

    .detail-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .detail-section {
      padding: 1.5rem;
      border-block-end: 1px solid var(--border);
    }

    .detail-section:last-child {
      border-block-end: none;
    }

    .detail-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-section h2::before {
      content: "";
      width: 4px;
      height: 24px;
      background: var(--primary);
      border-radius: 2px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      margin-bottom: 0.25rem;
    }

    .detail-item span {
      font-size: 0.875rem;
      color: var(--foreground);
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius);
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
      display: inline-block;
    }

    .status-autorizado {
      background: color-mix(in oklch, var(--success) 15%, transparent);
      color: var(--success);
    }

    .status-rechazado {
      background: color-mix(in oklch, var(--destructive) 15%, transparent);
      color: var(--destructive);
    }

    .status-pendiente {
      background: color-mix(in oklch, var(--warning) 15%, transparent);
      color: var(--warning);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: var(--accent);
      color: var(--foreground);
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-foreground);
      background: var(--primary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      filter: brightness(1.1);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
    }

    .muted-text {
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .historial-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .historial-table th,
    .historial-table td {
      padding: 0.5rem 0.75rem;
      text-align: start;
      vertical-align: top;
      border-block-end: 1px solid var(--border);
      white-space: nowrap;
    }

    .historial-table th {
      font-weight: 600;
      color: var(--muted-foreground);
      background: var(--surface);
      position: sticky;
      top: 0;
    }

    .historial-table tbody tr:hover {
      background: var(--accent);
    }

    .anio-cell {
      font-weight: 600;
      color: var(--primary);
    }

    .instrumento-legal {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .instrumento-legal small {
      font-size: 0.7rem;
      color: var(--muted-foreground);
    }

    .empty-row {
      text-align: center;
      color: var(--muted-foreground);
      padding: 2rem 1rem !important;
      white-space: normal !important;
    }

    .pdf-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--primary);
      text-decoration: none;
      border: 1px solid color-mix(in oklch, var(--primary) 40%, transparent);
      border-radius: var(--radius);
      padding: 0.2rem 0.5rem;
    }

    .pdf-link:hover {
      background: color-mix(in oklch, var(--primary) 10%, transparent);
    }

    .btn-edit {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--foreground);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-edit:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: color-mix(in oklch, var(--primary) 8%, transparent);
    }

    .actions-cell {
      display: flex;
      gap: 0.35rem;
      align-items: center;
      white-space: nowrap;
    }

    .btn-delete {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--foreground);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-delete:hover:not(:disabled) {
      border-color: #dc2626;
      color: #dc2626;
      background: color-mix(in oklch, #dc2626 8%, transparent);
    }

    .btn-delete:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class ProyeccionDetailComponent {
  private readonly proyeccionesService = inject(ProyeccionesService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  proyeccion = signal<Proyeccion | null>(null);
  loading = signal(false);
  error = signal(false);
  errorMessage = signal('');

  instrumentos = signal<ProyeccionInstrumento[]>([]);
  loadingInstrumentos = signal(false);
  dialogOpen = signal(false);
  editandoInstrumento = signal<ProyeccionInstrumento | null>(null);

  constructor() {
    this.loadProyeccion();
  }

  private loadProyeccion() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error.set(true);
      this.errorMessage.set('ID de proyección no proporcionado');
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      this.error.set(true);
      this.errorMessage.set('ID de proyección inválido');
      return;
    }

    this.loading.set(true);
    this.proyeccionesService.getById(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.proyeccion.set(data as Proyeccion);
        this.loading.set(false);
        this.loadInstrumentos(id);
      },
      error: (err: any) => {
        console.error('Error cargando detalle de proyección:', err);
        this.error.set(true);
        this.errorMessage.set('No se pudo cargar el detalle de la proyección');
        this.loading.set(false);
      }
    });
  }

  private loadInstrumentos(proyeccionId: number): void {
    this.loadingInstrumentos.set(true);
    this.proyeccionesService.getInstrumentos(proyeccionId).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.instrumentos.set(Array.isArray(data) ? data : []);
        this.loadingInstrumentos.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando historial de instrumentos:', err);
        this.instrumentos.set([]);
        this.loadingInstrumentos.set(false);
      }
    });
  }

  reloadInstrumentos(): void {
    const proyeccionId = this.proyeccion()?.id;
    if (proyeccionId) {
      this.loadInstrumentos(proyeccionId);
    }
  }

  onInstrumentosSaved(): void {
    this.reloadInstrumentos();
  }

  editarInstrumento(inst: ProyeccionInstrumento): void {
    this.editandoInstrumento.set(inst);
    this.dialogOpen.set(true);
  }

  /** Elimina un instrumento del historial (con confirmación). */
  eliminarInstrumento(inst: ProyeccionInstrumento): void {
    const proyeccionId = this.proyeccion()?.id;
    if (!proyeccionId) {
      return;
    }

    this.alertService
      .confirm(
        `¿Eliminar el instrumento del año ${inst.anio}?`,
        'Se borra el snapshot de ese año del historial. Esta acción no se puede deshacer.',
        'Sí, eliminar',
        'Cancelar'
      )
      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }

        this.proyeccionesService.deleteInstrumento(proyeccionId, inst.id).subscribe({
          next: () => {
            this.alertService.success('Instrumento eliminado', `Se eliminó el año ${inst.anio}.`);
            this.reloadInstrumentos();
          },
          error: (err: any) => {
            console.error('Error eliminando instrumento:', err);
            this.alertService.error(
              'No se pudo eliminar',
              err?.error?.message ?? 'Ocurrió un error al intentar eliminar el instrumento.'
            );
          },
        });
      });
  }

  cerrarDialogo(): void {
    this.dialogOpen.set(false);
    this.editandoInstrumento.set(null);
  }

  volverLista() {
    this.router.navigate(['/proyecciones']);
  }

  reload() {
    this.error.set(false);
    this.loadProyeccion();
  }
}