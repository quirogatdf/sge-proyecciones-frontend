import { Component, inject, signal, computed, effect, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ProyeccionesService,
  Proyeccion,
  ProyeccionInstrumento,
} from '../../core/services/proyecciones.service';
import { PayloadProyeccionConInstrumento, PayloadProyeccionPlaza } from '../../shared/models/proyeccion';
import { NivelesService } from '../../core/services/niveles.service';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { TurnosService } from '../../core/services/turnos.service';
import { InstitucionesService } from '../../core/services/instituciones.service';
import { ResolucionesService } from '../../core/services/resoluciones.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';
import { ExportDialogComponent } from './export-dialog.component';
import { AgregarInstrumentoDialogComponent } from './agregar-instrumento-dialog.component';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';
import { Observable } from 'rxjs';

// Servicio wrapper que transforma los datos para agregar campos de localidad y nombre de institución
class ProyeccionesServiceWrapper {
  private extraParams: Record<string, unknown> = {};

  /** Año en foco del último listado (default: último año con datos). */
  readonly anioActual = signal<string | null>(null);

  /** Años disponibles en todo el historial, ordenados descendente. */
  readonly aniosDisponibles = signal<string[]>([]);

  constructor(private proyeccionesService: ProyeccionesService) {}

  setExtraParams(params: Record<string, unknown>) {
    this.extraParams = params;
  }

  getExtraParams(): Record<string, unknown> {
    return this.extraParams;
  }

  getAll(params?: { page?: number; per_page?: number; search?: string; [key: string]: unknown }) {
    const mergedParams = { ...this.extraParams, ...params };
    return new Observable<{ data: any; meta: any }>(observer => {
      this.proyeccionesService.getAll(mergedParams).subscribe({
        next: (res: any) => {
          // Exponer el año en foco / años disponibles (del meta del backend)
          this.anioActual.set(res.meta?.anio ?? null);
          this.aniosDisponibles.set(Array.isArray(res.meta?.anios_disponibles) ? res.meta.anios_disponibles : []);
          // Transformar los datos para agregar campos calculados
          const transformedData = res.data.map((proyeccion: any) => {
            const horar = proyeccion.horar != null ? Number(proyeccion.horar) : 0;
            const cargos = proyeccion.cargos != null ? Number(proyeccion.cargos) : 0;
            const cantidad = horar > 0 ? horar : cargos > 0 ? cargos : null;

            return {
              ...proyeccion,
              localidad: proyeccion.institucion?.localidad || '',
              nombreInstitucion: proyeccion.institucion?.nombre || '',
              cargoDisplay: proyeccion.cargo
                ? `${proyeccion.cargo.codigo} - ${proyeccion.cargo.nombre}`
                : 'N/A',
              cantidadDisplay: cantidad != null ? String(cantidad) : '-',
              resolucionDisplay: proyeccion.resolucion?.nombre || proyeccion.resolucion_ministerial || '-'
            };
          });
          observer.next({ data: transformedData, meta: res.meta });
          observer.complete();
        },
        error: (err: any) => observer.error(err)
      });
    });
  }

  delete(id: number) {
    return this.proyeccionesService.delete(id);
  }
}

// Extendemos la interfaz Proyeccion para uso exclusivo en este componente
interface ProyeccionConLocalidad extends Proyeccion {
  localidad: string;
  nombreInstitucion: string;
  cargoDisplay: string;
  cantidadDisplay: string;
  resolucionDisplay: string;
}

interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'app-proyecciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudTableComponent, SearchableSelectComponent, ExportDialogComponent, AgregarInstrumentoDialogComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Proyecciones</h1>
        <button class="btn-export" (click)="openExportDialog()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel
        </button>
      </header>

      <!-- Filtros -->
      <div class="filters">
        <div class="filter-group">
          <label for="nivelFiltro">Filtrar por nivel:</label>
          <app-searchable-select
            id="nivelFiltro"
            [options]="nivelesOptions()"
            placeholder="Todos los niveles"
            [(value)]="selectedNivelId"
          />
        </div>
        <div class="filter-group">
          <label for="resolucionFiltro">Filtrar por resolución:</label>
          <app-searchable-select
            id="resolucionFiltro"
            [options]="resolucionesFilterOptions()"
            placeholder="Todas las resoluciones"
            [(value)]="selectedResolucionId"
          />
        </div>
        <div class="filter-group">
          <label for="localidadFiltro">Filtrar por localidad:</label>
          <app-searchable-select
            id="localidadFiltro"
            [options]="localidadFilterOptions()"
            placeholder="Todas las localidades"
            [(value)]="selectedLocalidad"
          />
        </div>
        <div class="filter-group">
          <label for="anioFiltro">Año:</label>
          <app-searchable-select
            id="anioFiltro"
            [options]="aniosFilterOptions()"
            placeholder="Año actual"
            [(value)]="selectedAnio"
          />
        </div>
      </div>

      <app-crud-table
        #crudTable
        [config]="tableConfig"
        [service]="proyeccionesServiceWrapper"
        [saving]="saving"
        [saveLabel]="saveLabel()"
        (modalOpened)="onModalOpened($event)"
        (save)="onSave(crudTable)"
        (viewDetail)="onViewDetail($event)"
      >
        <div form-content>
          <!-- Stepper (solo al CREAR: el alta es en dos pasos) -->
          @if (!editingId()) {
            <div class="stepper">
              <div class="step" [class.active]="pasoCreacion() === 1">
                <span class="step-num">1</span>
                <span class="step-label">Plaza</span>
              </div>
              <div class="step-sep"></div>
              <div class="step" [class.active]="pasoCreacion() === 2">
                <span class="step-num">2</span>
                <span class="step-label">Instrumento del año</span>
              </div>
            </div>
          }

          <!-- PASO 1 (alta) o EDICIÓN: datos de la plaza -->
          @if (editingId() || pasoCreacion() === 1) {
            <h3 class="section-title">Información Básica</h3>

          <div class="form-row">
            <div class="form-group" [class.has-error]="hasFieldError('id_nivel')">
              <label for="id_nivel">Nivel *</label>
              <app-searchable-select
                id="id_nivel"
                [options]="nivelesOptions()"
                placeholder="Seleccionar nivel..."
                [(value)]="formData.id_nivel"
              />
              @if (getFieldErrors('id_nivel').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('id_nivel'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>

            <div class="form-group" [class.has-error]="hasFieldError('id_institucion')">
              <label for="id_institucion">Institución *</label>
              <app-searchable-select
                id="id_institucion"
                [options]="institucionesOptions()"
                placeholder="Seleccionar institución..."
                [(value)]="formData.id_institucion"
              />
              @if (getFieldErrors('id_institucion').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('id_institucion'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="id_puesto">ID Puesto</label>
              <input
                id="id_puesto"
                type="text"
                [(ngModel)]="formData.id_puesto"
                placeholder="Opcional"
              />
            </div>
          </div>
          }

          <!-- ============================================================
               PASO 2 (alta): instrumento del año.
               La edición del instrumento se hace desde este mismo modal
               al editar (sección Historial de instrumentos).
               ============================================================ -->
          @if (!editingId() && pasoCreacion() === 2) {
          <div class="form-row">
            <div class="form-group" [class.has-error]="hasFieldError('estado')">
              <label for="estado">Estado *</label>
              <app-searchable-select
                id="estado"
                [options]="estadosOptions()"
                placeholder="Seleccionar estado..."
                [(value)]="formData.estado"
              />
              @if (getFieldErrors('estado').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('estado'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>

            <div class="form-group" [class.has-error]="hasFieldError('motivo')">
              <label for="motivo">Motivo *</label>
              <app-searchable-select
                id="motivo"
                [options]="motivosOptions()"
                placeholder="Seleccionar motivo..."
                [(value)]="formData.motivo"
              />
              @if (getFieldErrors('motivo').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('motivo'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>
          </div>

          @if (formData.motivo === 'Continuidad') {
            <div class="form-row">
              <div class="form-group">
                <label for="resolucion_previa_continuidad">Resolución Previa Continuidad</label>
                <input
                  id="resolucion_previa_continuidad"
                  type="text"
                  [(ngModel)]="formData.resolucion_previa_continuidad"
                  placeholder="Opcional"
                />
              </div>
            </div>
          }

          <div class="form-row">
            <div class="form-group">
              <label for="n_expediente">N° Expediente</label>
              <input
                id="n_expediente"
                type="text"
                [(ngModel)]="formData.n_expediente"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="año">Año</label>
              <input
                id="año"
                type="text"
                maxlength="4"
                [(ngModel)]="formData['año']"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="orden">Orden</label>
              <input id="orden" type="number" [(ngModel)]="formData.orden" placeholder="Opcional" />
            </div>
          </div>

          <!-- Fechas -->
          <h3 class="section-title">Fechas y Horarios</h3>

          <div class="form-row">
            <div class="form-group" [class.has-error]="hasFieldError('fecha_desde')">
              <label for="fecha_desde">Fecha Desde *</label>
              <input
                id="fecha_desde"
                type="date"
                [(ngModel)]="formData.fecha_desde"
                (input)="clearFieldError('fecha_desde')"
              />
            </div>

            <div class="form-group">
              <label for="fecha_hasta">Fecha Hasta</label>
              <input
                id="fecha_hasta"
                type="date"
                [(ngModel)]="formData.fecha_hasta"
                (input)="clearFieldError('fecha_hasta')"
              />
            </div>

            <div class="form-group">
              <label for="horar">Horas</label>
              <input id="horar" type="number" [(ngModel)]="formData.horar" placeholder="Opcional" />
            </div>

            <div class="form-group">
              <label for="cargos">Cargos</label>
              <input
                id="cargos"
                type="number"
                [(ngModel)]="formData.cargos"
                placeholder="Opcional"
              />
            </div>
          </div>

          <!-- Relaciones -->
          <h3 class="section-title">Relaciones</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="id_cargo">Cargo *</label>
              <app-searchable-select
                id="id_cargo"
                [options]="cargosOptions()"
                placeholder="Seleccionar cargo..."
                [(value)]="formData.id_cargo"
              />
              @if (getFieldErrors('id_cargo').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('id_cargo'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>

            <div class="form-group">
              <label for="id_funcion">Función *</label>
              <app-searchable-select
                id="id_funcion"
                [options]="funcionesOptions()"
                placeholder="Seleccionar función..."
                [(value)]="formData.id_funcion"
              />
              @if (getFieldErrors('id_funcion').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('id_funcion'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>

            <div class="form-group">
              <label for="id_turno">Turno *</label>
              <app-searchable-select
                id="id_turno"
                [options]="turnosOptions()"
                placeholder="Seleccionar turno..."
                [(value)]="formData.id_turno"
              />
              @if (getFieldErrors('id_turno').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('id_turno'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Destinos -->
          <h3 class="section-title">Destinos</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="destino_anterior">Destino Anterior</label>
              <input
                id="destino_anterior"
                type="text"
                [(ngModel)]="formData.destino_anterior"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group" [class.has-error]="hasFieldError('destino_nuevo')">
              <label for="destino_nuevo">Destino Nuevo *</label>
              <input
                id="destino_nuevo"
                type="text"
                [(ngModel)]="formData.destino_nuevo"
                placeholder="Ingrese destino nuevo..."
              />
              @if (getFieldErrors('destino_nuevo').length > 0) {
                <div class="error-messages">
                  @for (error of getFieldErrors('destino_nuevo'); track error) {
                    <small class="error-text">{{ error }}</small>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Resoluciones -->
          <h3 class="section-title">Resoluciones y Disposiciones</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="id_resolucion">Resolución Ministerial</label>
              <app-searchable-select
                id="id_resolucion"
                [options]="resolucionesOptions()"
                placeholder="Seleccionar resolución..."
                [(value)]="formData.id_resolucion"
              />
            </div>

            <div class="form-group">
              <label for="resolucion_ministerial_ext">Res. Ministerial Ext.</label>
              <input
                id="resolucion_ministerial_ext"
                type="text"
                [(ngModel)]="formData.resolucion_ministerial_ext"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="resolucion_ministerial_rect1">Resolución Ministerial Rect. 1</label>
              <input
                id="resolucion_ministerial_rect1"
                type="text"
                [(ngModel)]="formData.resolucion_ministerial_rect1"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="resolucion_ministerial_rect2">Resolución Ministerial Rect. 2</label>
              <input
                id="resolucion_ministerial_rect2"
                type="text"
                [(ngModel)]="formData.resolucion_ministerial_rect2"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="disposicion_sgnij">Disposición SGNIJ</label>
              <input
                id="disposicion_sgnij"
                type="text"
                [(ngModel)]="formData.disposicion_sgnij"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="rect_disposoco_sgnij">Rectificación</label>
              <input
                id="rect_disposoco_sgnij"
                type="text"
                [(ngModel)]="formData.rect_disposoco_sgnij"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="wizard-nav">
            <button type="button" class="btn-inline-secondary" (click)="irAPaso(1)">
              ← Volver a la plaza
            </button>
          </div>
          }

          <!-- ============================================================
               Historial de instrumentos (solo al EDITAR la plaza).
               Permite ver y modificar el snapshot de cada año.
               ============================================================ -->
          @if (editingId()) {
            <div class="historial-header">
              <h3 class="section-title">Historial de instrumentos</h3>
              <button type="button" class="btn-inline" (click)="agregarAnio()">
                ⊕ Agregar año
              </button>
            </div>

            @if (loadingHistorial()) {
              <p class="muted-text">Cargando historial...</p>
            } @else {
              <div class="table-wrapper">
                <table class="historial-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>Instrumento legal</th>
                      <th>Cargo</th>
                      <th>Horas</th>
                      <th>Cargos</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inst of historialInstrumentos(); track inst.id) {
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
                        <td>{{ inst.horar ?? '-' }}</td>
                        <td>{{ inst.cargos ?? '-' }}</td>
                        <td>{{ inst.estado || '-' }}</td>
                        <td>
                          <button
                            type="button"
                            class="btn-edit"
                            (click)="editarInstrumento(inst)"
                            title="Editar instrumento del año {{ inst.anio }}"
                          >
                            ✎ Editar
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="empty-row">
                          Sin historial todavía — usá "Agregar año" para registrar el primero.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      </app-crud-table>

      <app-agregar-instrumento-dialog
        [isOpen]="dialogInstrumentoOpen()"
        [proyeccion]="proyeccionSeleccionada()"
        [instrumentos]="historialInstrumentos()"
        [editando]="editandoInstrumento()"
        (closed)="cerrarDialogoInstrumento()"
        (saved)="onInstrumentoSaved()"
      />

      <app-export-dialog
        [isOpen]="exportDialogOpen()"
        (closed)="exportDialogOpen.set(false)"
        (exportComplete)="onExportComplete()"
      />
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        max-width: 100%;
      }

      .page-header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--foreground);
        margin: 0;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .btn-export {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--primary);
        color: var(--primary-foreground);
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
        transition: opacity 0.15s;
      }

      .btn-export:hover {
        opacity: 0.9;
      }

      .filters {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .filter-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--foreground);
      }

      .filter-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
        background: var(--background);
        color: var(--foreground);
        min-width: 200px;
      }

      .filter-select:focus {
        outline: none;
        border-color: var(--primary);
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--foreground);
        margin: 1rem 0 0.5rem 0;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid var(--border);
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        margin-bottom: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--foreground);
      }

      .form-group input,
      .form-group select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
        background: var(--background);
        color: var(--foreground);
        transition: border-color 0.2s ease;
      }

      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: var(--primary);
      }

      .form-group.has-error input,
      .form-group.has-error select {
        border-color: var(--destructive);
      }

      .form-group.has-error input:focus,
      .form-group.has-error select:focus {
        border-color: var(--destructive);
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--destructive) 20%, transparent);
      }

      .error-messages {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.25rem;
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--destructive);
        display: block;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
      }

      .status-autorizado {
        background-color: color-mix(in oklch, var(--success, #22c55e) 15%, transparent);
        color: var(--success, #22c55e);
      }

      .status-rechazado {
        background-color: color-mix(in oklch, var(--destructive) 15%, transparent);
        color: var(--destructive);
      }

      .status-pendiente {
        background-color: color-mix(in oklch, var(--warning, #f59e0b) 15%, transparent);
        color: var(--warning, #f59e0b);
      }

      .stepper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .step {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        opacity: 0.5;
        transition: opacity 0.2s ease;
      }

      .step.active {
        opacity: 1;
      }

      .step-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 9999px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--muted-foreground);
        background: var(--muted);
        border: 1px solid var(--border);
      }

      .step.active .step-num {
        color: var(--primary-foreground);
        background: var(--primary);
        border-color: var(--primary);
      }

      .step-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--foreground);
        white-space: nowrap;
      }

      .step-sep {
        flex: 1;
        height: 1px;
        background: var(--border);
        min-width: 1.5rem;
      }

      .wizard-nav {
        display: flex;
        justify-content: flex-start;
        margin-top: 0.5rem;
      }

      .btn-inline-secondary {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--foreground);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn-inline-secondary:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      .historial-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .historial-header .section-title {
        flex: 1;
        margin-bottom: 0;
      }

      .btn-inline {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--primary-foreground);
        background: var(--primary);
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
        white-space: nowrap;
        transition: filter 0.15s ease;
      }

      .btn-inline:hover {
        filter: brightness(1.1);
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
    `,
  ],
})
export class ProyeccionesListComponent implements OnInit {
  readonly proyeccionesService = inject(ProyeccionesService);
  private readonly router = inject(Router);
  private readonly nivelesService = inject(NivelesService);
  private readonly cargosService = inject(CargosService);
  private readonly funcionesService = inject(FuncionesService);
  private readonly turnosService = inject(TurnosService);
  private readonly institucionesService = inject(InstitucionesService);
  private readonly resolucionesService = inject(ResolucionesService);
  private readonly alertService = inject(AlertService);

  @ViewChild('crudTable') crudTable?: any;

  // Wrapper service para transformar datos
  proyeccionesServiceWrapper!: ProyeccionesServiceWrapper;

  constructor() {
    this.proyeccionesServiceWrapper = new ProyeccionesServiceWrapper(this.proyeccionesService);
  }

  saving = signal(false);
  exportDialogOpen = signal(false);
  niveles = signal<{ id: number; nombre: string }[]>([]);
  cargos = signal<Cargo[]>([]);
  funciones = signal<{ id: number; nombre: string }[]>([]);
  turnos = signal<{ id: number; nombre: string }[]>([]);
  instituciones = signal<{ id: number; nombre: string }[]>([]);
  resoluciones = signal<{ id: number; nombre: string }[]>([]);
  selectedNivelId = signal<number | null>(null);
  selectedResolucionId = signal<number | null>(null);
  selectedLocalidad = signal<string | null>(null);

  /** Año calendario actual — default del selector de año. */
  readonly anioActualStr = new Date().getFullYear().toString();
  selectedAnio = signal<string | null>(this.anioActualStr);

  // Historial de instrumentos de la plaza en edición (modal de editar)
  historialInstrumentos = signal<ProyeccionInstrumento[]>([]);
  loadingHistorial = signal(false);
  proyeccionSeleccionada = signal<Proyeccion | null>(null);
  dialogInstrumentoOpen = signal(false);
  editandoInstrumento = signal<ProyeccionInstrumento | null>(null);

  /** Paso del alta (solo al crear): 1 = plaza, 2 = instrumento del año. */
  pasoCreacion = signal<1 | 2>(1);

  /** Texto del botón de guardar del modal, según el paso / modo. */
  readonly saveLabel = computed(() => {
    if (this.editingId()) return 'Guardar';
    return this.pasoCreacion() === 1 ? 'Siguiente' : 'Crear proyección';
  });

  // Effect para filtrar automáticamente cuando cambia nivel, resolución, localidad o año
  private filtrosEffect = effect(() => {
    const params: Record<string, unknown> = {};
    const nivelId = this.selectedNivelId();
    const resolucionId = this.selectedResolucionId();
    const localidad = this.selectedLocalidad();
    const anio = this.selectedAnio();
    if (nivelId) params['id_nivel'] = nivelId;
    if (resolucionId) params['id_resolucion'] = resolucionId;
    if (localidad) params['localidad'] = localidad;
    if (anio) params['anio'] = anio;
    this.proyeccionesServiceWrapper.setExtraParams(params);
    if (this.crudTable) {
      this.crudTable.reloadData();
    }
  });

  // Opciones estáticas para selects
  readonly estadosOptions = signal<SelectOption[]>([
    { id: 'Autorizado', label: 'Autorizado' },
    { id: 'Rechazado', label: 'Rechazado' },
    { id: 'Pendiente', label: 'Pendiente' },
  ]);

  readonly motivosOptions = signal<SelectOption[]>([
    { id: 'Creación', label: 'Creación' },
    { id: 'Continuidad', label: 'Continuidad' },
    { id: 'Baja', label: 'Baja' },
    { id: 'Sin definir', label: 'Sin definir' },
  ]);

  // Opciones computadas para selects dinámicos
  readonly nivelesOptions = computed(() => [
    { id: null as unknown as number, label: 'Todos los niveles' },
    ...this.niveles().map((n) => ({ id: n.id, label: n.nombre })),
  ]);

  readonly resolucionesFilterOptions = computed(() => [
    { id: null as unknown as number, label: 'Todas las resoluciones' },
    ...this.resoluciones().map((r) => ({ id: r.id, label: r.nombre })),
  ]);

  readonly localidadFilterOptions = signal<SelectOption[]>([
    { id: null as unknown as string, label: 'Todas las localidades' },
    { id: 'Rio Grande', label: 'Río Grande' },
    { id: 'Ushuaia', label: 'Ushuaia' },
    { id: 'Tolhuin', label: 'Tolhuin' },
  ]);

  /** Opciones del selector de año (default: año actual). */
  readonly aniosFilterOptions = computed<SelectOption[]>(() => {
    const disponibles = this.proyeccionesServiceWrapper.aniosDisponibles();
    // Garantizar que el año actual esté siempre en las opciones (aunque no tenga datos)
    const anios = disponibles.includes(this.anioActualStr)
      ? disponibles
      : [this.anioActualStr, ...disponibles];
    return [
      { id: null as unknown as string, label: 'Último año con datos' },
      ...anios.map((anio) => ({ id: anio, label: anio })),
    ];
  });

  readonly institucionesOptions = computed(() =>
    this.instituciones().map((i) => ({ id: i.id, label: i.nombre })),
  );

  readonly cargosOptions = computed(() =>
    this.cargos().map((c) => ({ id: c.id, label: `${c.codigo} - ${c.nombre}` })),
  );

  readonly funcionesOptions = computed(() =>
    this.funciones().map((f) => ({ id: f.id, label: f.nombre })),
  );

  readonly turnosOptions = computed(() =>
    this.turnos().map((t) => ({ id: t.id, label: t.nombre })),
  );

  readonly resolucionesOptions = computed(() =>
    this.resoluciones().map((r) => ({ id: r.id, label: r.nombre })),
  );
  editingId = signal<number | null>(null);

  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});

  formData: any = {
    estado: '',
    motivo: '',
    fecha_desde: '',
    fecha_hasta: '',
    id_puesto: '',
    año: '',
    id_resolucion: null as number | null,
    resolucion_previa_continuidad: '',
    resolucion_ministerial_rect1: '',
    resolucion_ministerial_rect2: '',
    destino_anterior: '',
    destino_nuevo: '',
  };

  tableConfig: CrudTableConfig<ProyeccionConLocalidad> = {
    title: 'Proyecciones',
    pageSize: 25,
    searchPlaceholder: 'Buscar proyecciones...',
    showViewDetail: true,
    serverSide: true,
    createButtonLabel: 'Nueva Proyección',
    createTitle: 'Nueva Proyección',
    editTitle: 'Editar Proyección',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      {
        key: 'id_nivel',
        label: 'Nivel',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.nivel?.nombre || 'N/A',
      },
      {
        key: 'localidad',
        label: 'Localidad',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.localidad || 'N/A'
      },
      {
        key: 'nombreInstitucion',
        label: 'Institución',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.nombreInstitucion || 'N/A'
      },
      {
        key: 'cantidadDisplay',
        label: 'Cantidad',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.cantidadDisplay
      },
      {
        key: 'cargoDisplay',
        label: 'Cargo',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.cargoDisplay || 'N/A'
      },
      {
        key: 'año',
        label: 'Año',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => {
          const value = item['año'];
          return value !== null && value !== undefined && value !== '' ? String(value) : '-';
        }
      },
      {
        key: 'orden',
        label: 'Orden',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => {
          const value = item.orden;
          return value !== null && value !== undefined && value !== '' ? String(value) : '-';
        }
      },
      {
        key: 'estado',
        label: 'Estado',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => {
          const color =
            item.estado === 'Autorizado'
              ? '#22c55e'
              : item.estado === 'Rechazado'
                ? '#ef4444'
                : '#f59e0b';
          const bgColor =
            item.estado === 'Autorizado'
              ? 'rgba(34, 197, 94, 0.15)'
              : item.estado === 'Rechazado'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(245, 158, 11, 0.15)';
          return `<span style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;text-align:center;white-space:nowrap;background-color:${bgColor};color:${color};">${item.estado}</span>`;
        },
      },
      { key: 'motivo', label: 'Motivo', sortable: true },
      {
        key: 'resolucionDisplay',
        label: 'Resolución Ministerial',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.resolucionDisplay || item.resolucion?.nombre || '-'
      },
      {
        key: 'destino_nuevo',
        label: 'Destino',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.destino_nuevo || '-',
      },
      {
        key: 'id_puesto',
        label: 'ID Puesto',
        sortable: true,
        render: (item: ProyeccionConLocalidad) => item.id_puesto || '-',
      },
    ],
    // searchFields removed - now searches all columns including rendered content
  };

  ngOnInit() {
    this.loadNiveles();
    this.loadCargos();
    this.loadFunciones();
    this.loadTurnos();
    this.loadInstituciones();
    this.loadResoluciones();
  }

  private loadNiveles() {
    this.nivelesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.niveles.set(
          Array.isArray(data) ? data.map((n: any) => ({ id: n.id, nombre: n.nombre })) : [],
        );
      },
      error: (err: any) => {
        console.error('Error cargando niveles:', err);
        this.alertService.error('Error', 'No se pudieron cargar los niveles');
      },
    });
  }

  private loadCargos() {
    this.cargosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        // Asignar directamente como Cargo[] (no mapear para no perder codigo)
        this.cargos.set(Array.isArray(data) ? data : [data]);
      },
      error: (err: any) => console.error('Error cargando cargos:', err),
    });
  }

  private loadFunciones() {
    this.funcionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.funciones.set(
          Array.isArray(data) ? data.map((f: any) => ({ id: f.id, nombre: f.nombre })) : [],
        );
      },
      error: (err: any) => console.error('Error cargando funciones:', err),
    });
  }

  private loadTurnos() {
    this.turnosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.turnos.set(
          Array.isArray(data) ? data.map((t: any) => ({ id: t.id, nombre: t.nombre })) : [],
        );
      },
      error: (err: any) => console.error('Error cargando turnos:', err),
    });
  }

  private loadInstituciones() {
    this.institucionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.instituciones.set(
          Array.isArray(data) ? data.map((i: any) => ({ id: i.id, nombre: i.nombre })) : [],
        );
      },
      error: (err: any) => {
        console.error('Error cargando instituciones:', err);
        this.alertService.error('Error', 'No se pudieron cargar las instituciones');
      },
    });
  }

  private loadResoluciones() {
    this.resolucionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.resoluciones.set(
          Array.isArray(data) ? data.map((r: any) => ({ id: r.id, nombre: r.nombre })) : [],
        );
      },
      error: (err: any) => console.error('Error cargando resoluciones:', err),
    });
  }

  onNivelFilterChange() {
    const nivelId = this.selectedNivelId();
    this.proyeccionesService.setNivelFiltro(nivelId);
    if (this.crudTable) {
      this.crudTable.reloadData();
    }
  }

  private formatDateForInput(date: string | null | undefined): string {
    if (!date) return '';
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Si no, convertir del formato ISO al formato esperado por input[type=date]
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  onModalOpened(item: Proyeccion | null) {
    this.submitted.set(false);
    this.formErrors.set({});
    this.editingId.set(item?.id || null);
    this.pasoCreacion.set(1);
    this.proyeccionSeleccionada.set(item);
    this.cerrarDialogoInstrumento();

    if (item?.id) {
      this.loadHistorial(item.id);
    } else {
      this.historialInstrumentos.set([]);
    }

    if (item) {
      // Editando - cargar todos los campos
      this.formData = {
        id_nivel: item.id_nivel,
        id_institucion: item.id_institucion,
        estado: item.estado || '',
        motivo: item.motivo || '',
        n_expediente: item.n_expediente || '',
        orden: item.orden !== null && item.orden !== undefined ? item.orden : null,
        fecha_desde: this.formatDateForInput(item.fecha_desde),
        fecha_hasta: this.formatDateForInput(item.fecha_hasta),
        horar: item.horar !== null && item.horar !== undefined ? item.horar : 0,
        cargos: item.cargos !== null && item.cargos !== undefined ? item.cargos : 0,
        id_cargo: item.id_cargo !== null && item.id_cargo !== undefined ? item.id_cargo : null,
        id_funcion:
          item.id_funcion !== null && item.id_funcion !== undefined ? item.id_funcion : null,
        id_turno: item.id_turno !== null && item.id_turno !== undefined ? item.id_turno : null,
        id_resolucion: (item as any).id_resolucion ?? item.resolucion?.id ?? null,
        resolucion_ministerial_ext: item.resolucion_ministerial_ext || '',
        disposicion_sgnij: item.disposicion_sgnij || '',
        rect_disposoco_sgnij: item.rect_disposoco_sgnij || '',
        id_puesto: item.id_puesto || '',
        año: item['año'] || '',
        resolucion_previa_continuidad: item.resolucion_previa_continuidad || '',
        resolucion_ministerial_rect1: item.resolucion_ministerial_rect1 || '',
        resolucion_ministerial_rect2: item.resolucion_ministerial_rect2 || '',
        destino_anterior: item.destino_anterior || '',
        destino_nuevo: item.destino_nuevo || '',
      };
    } else {
      // Nuevo - limpiar formulario
      this.formData = {
        id_nivel: null,
        id_institucion: null,
        estado: '',
        motivo: '',
        n_expediente: '',
        orden: null,
        fecha_desde: '',
        fecha_hasta: '',
        horar: 0,
        cargos: 0,
        id_cargo: null,
        id_funcion: null,
        id_turno: null,
        año: '',
        id_resolucion: null,
        resolucion_ministerial_ext: '',
        disposicion_sgnij: '',
        rect_disposoco_sgnij: '',
        id_puesto: null,
        resolucion_previa_continuidad: '',
        resolucion_ministerial_rect1: '',
        resolucion_ministerial_rect2: '',
        destino_anterior: '',
        destino_nuevo: '',
      };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    const isEditing = this.editingId() !== null;

    // Validación básica de la plaza (aplica en ambos pasos del alta y al editar)
    const errors: Record<string, string[]> = {};
    if (!this.formData.id_nivel) errors['id_nivel'] = ['El nivel es obligatorio'];
    if (!this.formData.id_institucion) errors['id_institucion'] = ['La institución es obligatoria'];

    // Alta en dos pasos: en el paso 1 solo se valida la plaza y se avanza al paso 2.
    if (!isEditing && this.pasoCreacion() === 1) {
      if (Object.keys(errors).length > 0) {
        this.formErrors.set(errors);
        return;
      }
      this.formErrors.set({});
      this.pasoCreacion.set(2);
      return;
    }

    // Los campos del instrumento solo se validan/solicitan al CREAR (paso 2).
    // Al editar, solo se actualiza la plaza (el instrumento se edita en el historial).
    if (!isEditing) {
      if (!this.formData.estado) errors['estado'] = ['El estado es obligatorio'];
      if (!this.formData.motivo) errors['motivo'] = ['El motivo es obligatorio'];
      if (!this.formData['año']) errors['año'] = ['El año es obligatorio'];
      if (!this.formData.fecha_desde) errors['fecha_desde'] = ['La fecha desde es obligatoria'];
      if (!this.formData.destino_nuevo) errors['destino_nuevo'] = ['El destino nuevo es obligatorio'];
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.saving.set(true);
    this.formErrors.set({});

    // Limpiar valores vacíos para evitar errores 422
    const clean = <T extends Record<string, unknown>>(data: T): Partial<T> =>
      Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null),
      ) as Partial<T>;

    // La plaza (vive en `proyecciones`)
    const plaza: PayloadProyeccionPlaza = {
      id_nivel: this.formData.id_nivel ?? null,
      id_institucion: this.formData.id_institucion ?? null,
      id_puesto: this.formData.id_puesto || null,
    };

    // Sobre los campos del instrumento (los que acepta el backend para crear)
    const camposInstrumento = [
      'estado', 'motivo', 'n_expediente', 'orden', 'fecha_desde', 'fecha_hasta',
      'horar', 'cargos', 'id_cargo', 'id_funcion', 'id_turno', 'id_resolucion',
      'resolucion_ministerial_ext', 'disposicion_sgnij', 'rect_disposoco_sgnij',
      'resolucion_previa_continuidad', 'resolucion_ministerial_rect1',
      'resolucion_ministerial_rect2', 'destino_anterior', 'destino_nuevo',
    ];
    const instrumento = clean({
      anio: this.formData['año'],
      ...Object.fromEntries(
        camposInstrumento.map((campo) => [campo, this.formData[campo]]),
      ),
    });

    const payload = isEditing
      ? plaza // update: solo la plaza
      : ({ ...plaza, instrumento } as PayloadProyeccionConInstrumento); // create: plaza + primer instrumento atómico

    console.log('Enviando payload:', JSON.stringify(payload, null, 2));

    const request = isEditing
      ? this.proyeccionesService.update(this.editingId()!, payload)
      : this.proyeccionesService.create(payload);

    request.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const message = isEditing
          ? 'Proyección actualizada exitosamente'
          : 'Proyección creada exitosamente';
        this.alertService.success('Éxito', res.message || message);
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('Error guardando proyección:', err);
        console.error('Error body:', err.error);

        if (err.status === 422 && err.error?.errors) {
          this.formErrors.set(err.error.errors);
          // Mostrar alerta con el primer error
          const firstError = Object.values(err.error.errors)[0] as string[];
          if (firstError && firstError[0]) {
            this.alertService.error('Error de validación', firstError[0]);
          }
        } else {
          this.alertService.error('Error', 'No se pudo guardar la proyección');
        }
      },
    });
  }

  hasFieldError(field: string): boolean {
    return this.formErrors()[field]?.length > 0;
  }

  getFieldErrors(field: string): string[] {
    return this.formErrors()[field] || [];
  }

  clearFieldError(field: string) {
    if (this.formErrors()[field]) {
      const newErrors = { ...this.formErrors() };
      delete newErrors[field];
      this.formErrors.set(newErrors);
    }
  }

  /** Navega entre los pasos del alta (solo al crear). */
  irAPaso(paso: 1 | 2): void {
    this.pasoCreacion.set(paso);
  }

  /** Carga el historial de instrumentos de la plaza en edición. */
  private loadHistorial(proyeccionId: number): void {
    this.loadingHistorial.set(true);
    this.proyeccionesService.getInstrumentos(proyeccionId).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.historialInstrumentos.set(Array.isArray(data) ? data : []);
        this.loadingHistorial.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando historial de instrumentos:', err);
        this.historialInstrumentos.set([]);
        this.loadingHistorial.set(false);
      },
    });
  }

  /** Abre el diálogo para agregar un año nuevo al historial. */
  agregarAnio(): void {
    this.editandoInstrumento.set(null);
    this.dialogInstrumentoOpen.set(true);
  }

  /** Abre el diálogo para editar un instrumento del historial. */
  editarInstrumento(inst: ProyeccionInstrumento): void {
    this.editandoInstrumento.set(inst);
    this.dialogInstrumentoOpen.set(true);
  }

  cerrarDialogoInstrumento(): void {
    this.dialogInstrumentoOpen.set(false);
    this.editandoInstrumento.set(null);
  }

  /** Tras guardar un instrumento: recargar historial y el listado. */
  onInstrumentoSaved(): void {
    const id = this.editingId();
    if (id) {
      this.loadHistorial(id);
    }
    if (this.crudTable) {
      this.crudTable.reloadData();
    }
  }

  onViewDetail(id: number) {
    this.router.navigate(['/proyecciones', id]);
  }

  openExportDialog() {
    this.exportDialogOpen.set(true);
  }

  onExportComplete() {
    // Optionally reload data after export
    if (this.crudTable) {
      this.crudTable.reloadData();
    }
  }
}
