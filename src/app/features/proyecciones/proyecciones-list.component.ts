import { Component, inject, signal, computed, effect, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionesService, Proyeccion } from '../../core/services/proyecciones.service';
import { NivelesService } from '../../core/services/niveles.service';
import { CargosService } from '../../core/services/cargos.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { TurnosService } from '../../core/services/turnos.service';
import { InstitucionesService } from '../../core/services/instituciones.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';

interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'app-proyecciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudTableComponent, SearchableSelectComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Proyecciones</h1>
      </header>

        <!-- Filtro por nivel -->
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
        </div>

      <app-crud-table
        #crudTable
        [config]="tableConfig"
        [service]="proyeccionesService"
        [saving]="saving"
        (modalOpened)="onModalOpened($event)"
        (save)="onSave(crudTable)"
      >
        <div form-content>
          <!-- Información básica -->
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
              <label for="orden">Orden</label>
              <input 
                id="orden" 
                type="number" 
                [(ngModel)]="formData.orden" 
                placeholder="Opcional"
              />
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
              <input 
                id="horar" 
                type="number" 
                [(ngModel)]="formData.horar" 
                placeholder="Opcional"
              />
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

          <!-- Resoluciones -->
          <h3 class="section-title">Resoluciones y Disposiciones</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="resolucion_ministerial">Resolución Ministerial</label>
              <input 
                id="resolucion_ministerial" 
                type="text" 
                [(ngModel)]="formData.resolucion_ministerial" 
                placeholder="Opcional"
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
        </div>
      </app-crud-table>
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
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
  `]
})
export class ProyeccionesListComponent implements OnInit {
  readonly proyeccionesService = inject(ProyeccionesService);
  private readonly nivelesService = inject(NivelesService);
  private readonly cargosService = inject(CargosService);
  private readonly funcionesService = inject(FuncionesService);
  private readonly turnosService = inject(TurnosService);
  private readonly institucionesService = inject(InstitucionesService);
  private readonly alertService = inject(AlertService);

  @ViewChild('crudTable') crudTable?: any;

  saving = signal(false);
  niveles = signal<{ id: number; nombre: string }[]>([]);
  cargos = signal<{ id: number; nombre: string }[]>([]);
  funciones = signal<{ id: number; nombre: string }[]>([]);
  turnos = signal<{ id: number; nombre: string }[]>([]);
  instituciones = signal<{ id: number; nombre: string }[]>([]);
  selectedNivelId = signal<number | null>(null);

  // Effect para filtrar automáticamente cuando cambia el nivel
  private nivelFilterEffect = effect(() => {
    const nivelId = this.selectedNivelId();
    this.proyeccionesService.setNivelFiltro(nivelId);
    if (this.crudTable) {
      this.crudTable.reloadData();
    }
  });

  // Opciones estáticas para selects
  readonly estadosOptions = signal<SelectOption[]>([
    { id: 'Autorizado', label: 'Autorizado' },
    { id: 'Rechazado', label: 'Rechazado' },
    { id: 'Pendiente', label: 'Pendiente' }
  ]);

  readonly motivosOptions = signal<SelectOption[]>([
    { id: 'Creación', label: 'Creación' },
    { id: 'Continuidad', label: 'Continuidad' },
    { id: 'Baja', label: 'Baja' },
    { id: 'Sin definir', label: 'Sin definir' }
  ]);

  // Opciones computadas para selects dinámicos
  readonly nivelesOptions = computed(() => [
    { id: null as unknown as number, label: 'Todos los niveles' },
    ...this.niveles().map(n => ({ id: n.id, label: n.nombre }))
  ]);

  readonly institucionesOptions = computed(() =>
    this.instituciones().map(i => ({ id: i.id, label: i.nombre }))
  );

  readonly cargosOptions = computed(() =>
    this.cargos().map(c => ({ id: c.id, label: c.nombre }))
  );

  readonly funcionesOptions = computed(() =>
    this.funciones().map(f => ({ id: f.id, label: f.nombre }))
  );

  readonly turnosOptions = computed(() =>
    this.turnos().map(t => ({ id: t.id, label: t.nombre }))
  );
  editingId = signal<number | null>(null);

  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});
  
  formData: any = {
    estado: '',
    motivo: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  tableConfig: CrudTableConfig<Proyeccion> = {
    title: 'Proyecciones',
    pageSize: 25,
    searchPlaceholder: 'Buscar proyecciones...',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { 
        key: 'id_nivel', 
        label: 'Nivel', 
        sortable: true,
        render: (item: Proyeccion) => item.nivel?.nombre || 'N/A'
      },
      { 
        key: 'id_institucion', 
        label: 'Institución', 
        sortable: true,
        render: (item: Proyeccion) => item.institucion?.nombre || 'N/A'
      },
      { 
        key: 'estado', 
        label: 'Estado', 
        sortable: true,
        render: (item: Proyeccion) => {
          const color = item.estado === 'Autorizado' ? '#22c55e' :
                     item.estado === 'Rechazado' ? '#ef4444' : '#f59e0b';
          const bgColor = item.estado === 'Autorizado' ? 'rgba(34, 197, 94, 0.15)' :
                         item.estado === 'Rechazado' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
          return `<span style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;text-align:center;white-space:nowrap;background-color:${bgColor};color:${color};">${item.estado}</span>`;
        }
      },
      { key: 'motivo', label: 'Motivo', sortable: true },
      { key: 'n_expediente', label: 'N° Expediente', sortable: false },
      { 
        key: 'fecha_desde', 
        label: 'Fecha Desde', 
        sortable: true,
        render: (item: Proyeccion) => {
          if (!item.fecha_desde) return '-';
          const parts = item.fecha_desde.split('T')[0].split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      },
      { 
        key: 'fecha_hasta', 
        label: 'Fecha Hasta', 
        sortable: false,
        render: (item: Proyeccion) => {
          if (!item.fecha_hasta) return '-';
          const parts = item.fecha_hasta.split('T')[0].split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      },
    ],
    searchFields: ['id', 'motivo', 'n_expediente']
  };

  ngOnInit() {
    this.loadNiveles();
    this.loadCargos();
    this.loadFunciones();
    this.loadTurnos();
    this.loadInstituciones();
  }

  private loadNiveles() {
    this.nivelesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.niveles.set(Array.isArray(data) ? data.map((n: any) => ({ id: n.id, nombre: n.nombre })) : []);
      },
      error: (err: any) => {
        console.error('Error cargando niveles:', err);
        this.alertService.error('Error', 'No se pudieron cargar los niveles');
      }
    });
  }

  private loadCargos() {
    this.cargosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.cargos.set(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, nombre: c.nombre })) : []);
      },
      error: (err: any) => console.error('Error cargando cargos:', err)
    });
  }

  private loadFunciones() {
    this.funcionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.funciones.set(Array.isArray(data) ? data.map((f: any) => ({ id: f.id, nombre: f.nombre })) : []);
      },
      error: (err: any) => console.error('Error cargando funciones:', err)
    });
  }

  private loadTurnos() {
    this.turnosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.turnos.set(Array.isArray(data) ? data.map((t: any) => ({ id: t.id, nombre: t.nombre })) : []);
      },
      error: (err: any) => console.error('Error cargando turnos:', err)
    });
  }

  private loadInstituciones() {
    this.institucionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.instituciones.set(Array.isArray(data) ? data.map((i: any) => ({ id: i.id, nombre: i.nombre })) : []);
      },
      error: (err: any) => {
        console.error('Error cargando instituciones:', err);
        this.alertService.error('Error', 'No se pudieron cargar las instituciones');
      }
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

    if (item) {
      // Editando - cargar todos los campos
      this.formData = {
        id_nivel: item.id_nivel,
        id_institucion: item.id_institucion,
        estado: item.estado || '',
        motivo: item.motivo || '',
        n_expediente: item.n_expediente || '',
        orden: item.orden || null,
        fecha_desde: this.formatDateForInput(item.fecha_desde),
        fecha_hasta: this.formatDateForInput(item.fecha_hasta),
        horar: item.horar || null,
        cargos: item.cargos || null,
        id_cargo: item.id_cargo || null,
        id_funcion: item.id_funcion || null,
        id_turno: item.id_turno || null,
        resolucion_ministerial: item.resolucion_ministerial || '',
        resolucion_ministerial_ext: item.resolucion_ministerial_ext || '',
        disposicion_sgnij: item.disposicion_sgnij || '',
        rect_disposoco_sgnij: item.rect_disposoco_sgnij || ''
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
        horar: null,
        cargos: null,
        id_cargo: null,
        id_funcion: null,
        id_turno: null,
        resolucion_ministerial: '',
        resolucion_ministerial_ext: '',
        disposicion_sgnij: '',
        rect_disposoco_sgnij: ''
      };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    
    // Validación básica
    const errors: Record<string, string[]> = {};
    if (!this.formData.id_nivel) errors['id_nivel'] = ['El nivel es obligatorio'];
    if (!this.formData.estado) errors['estado'] = ['El estado es obligatorio'];
    if (!this.formData.motivo) errors['motivo'] = ['El motivo es obligatorio'];
    if (!this.formData.fecha_desde) errors['fecha_desde'] = ['La fecha desde es obligatoria'];
    if (!this.formData.id_institucion) errors['id_institucion'] = ['La institución es obligatoria'];

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.saving.set(true);
    this.formErrors.set({});

    const isEditing = this.editingId() !== null;
    const request = isEditing 
      ? this.proyeccionesService.update(this.editingId()!, this.formData)
      : this.proyeccionesService.create(this.formData);

    request.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const message = isEditing ? 'Proyección actualizada exitosamente' : 'Proyección creada exitosamente';
        this.alertService.success('Éxito', res.message || message);
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('Error guardando proyección:', err);
        
        if (err.status === 422 && err.error?.errors) {
          this.formErrors.set(err.error.errors);
        } else {
          this.alertService.error('Error', 'No se pudo guardar la proyección');
        }
      }
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
}