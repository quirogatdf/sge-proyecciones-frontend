import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionesService } from '../../core/services/proyecciones.service';
import { Proyeccion, ProyeccionInstrumento } from '../../core/services/proyecciones.service';
import { PayloadProyeccionInstrumento } from '../../shared/models/proyeccion-instrumento';
import { AlertService } from '../../core/services/alert.service';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { TurnosService } from '../../core/services/turnos.service';
import { ResolucionesService } from '../../core/services/resoluciones.service';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';

type ModoAgregar = 'copiar_anterior' | 'historial' | 'nuevo';

interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'app-agregar-instrumento-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  template: `
  @if (isOpen()) {
    <div class="dialog-overlay" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>{{ editando() ? 'Editar instrumento' : 'Agregar año de instrumento' }}</h2>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <div class="dialog-body">
          <!-- Año -->
          <div class="form-row">
            <div class="form-group">
              <label for="anio">Año</label>
              <input
                id="anio"
                type="text"
                maxlength="4"
                placeholder="Ej: 2027"
                [(ngModel)]="form.anio"
              />
              @if (anioError()) {
                <span class="field-error">{{ anioError() }}</span>
              }
            </div>

            <div class="form-group">
              <label for="estado">Estado *</label>
              <app-searchable-select
                id="estado"
                [options]="estadosOptions()"
                placeholder="Seleccionar estado..."
                [(value)]="form.estado"
              />
            </div>
          </div>

          <!-- Modo de origen (solo al agregar) -->
          @if (!editando()) {
            <div class="form-group">
              <label>Origen del instrumento</label>

              <label class="radio-item">
                <input
                  type="radio"
                  name="modo"
                  [value]="'copiar_anterior'"
                  [checked]="modo() === 'copiar_anterior'"
                  (change)="onModoChange('copiar_anterior')"
                />
                <span>
                  <strong>Copiar del último año</strong>
                  <small>Usa el snapshot más reciente ({{ ultimoAnioDisponible() }}) como base.</small>
                </span>
              </label>

              <label class="radio-item">
                <input
                  type="radio"
                  name="modo"
                  [value]="'historial'"
                  [checked]="modo() === 'historial'"
                  (change)="onModoChange('historial')"
                />
                <span>
                  <strong>Elegir del historial</strong>
                  <small>Seleccioná un año y se copian sus datos.</small>
                </span>
              </label>

              @if (modo() === 'historial') {
                <select class="historial-select" [ngModel]="anioHistorial()" (ngModelChange)="onAnioHistorialChange($event)">
                  @for (anioItem of historialAnios(); track anioItem) {
                    <option [ngValue]="anioItem">{{ anioItem }}</option>
                  }
                </select>
              }

              <label class="radio-item">
                <input
                  type="radio"
                  name="modo"
                  [value]="'nuevo'"
                  [checked]="modo() === 'nuevo'"
                  (change)="onModoChange('nuevo')"
                />
                <span>
                  <strong>Crear en blanco</strong>
                  <small>Arrancá con el formulario vacío y cargá los datos del año nuevo.</small>
                </span>
              </label>
            </div>
          }

          <!-- Campos del instrumento -->
          <div class="form-row">
            <div class="form-group">
              <label for="motivo">Motivo</label>
              <app-searchable-select
                id="motivo"
                [options]="motivosOptions()"
                placeholder="Seleccionar motivo..."
                [(value)]="form.motivo"
              />
            </div>

            <div class="form-group">
              <label for="n_expediente">N° Expediente</label>
              <input
                id="n_expediente"
                type="text"
                [(ngModel)]="form.n_expediente"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="orden">Orden</label>
              <input id="orden" type="number" [(ngModel)]="form.orden" placeholder="Opcional" />
            </div>
          </div>

          @if (form.motivo === 'Continuidad') {
            <div class="form-group">
              <label for="resolucion_previa_continuidad">Resolución Previa Continuidad</label>
              <input
                id="resolucion_previa_continuidad"
                type="text"
                [(ngModel)]="form.resolucion_previa_continuidad"
                placeholder="Opcional"
              />
            </div>
          }

          <div class="form-row">
            <div class="form-group">
              <label for="fecha_desde">Fecha Desde</label>
              <input
                id="fecha_desde"
                type="date"
                [(ngModel)]="form.fecha_desde"
              />
            </div>

            <div class="form-group">
              <label for="fecha_hasta">Fecha Hasta</label>
              <input
                id="fecha_hasta"
                type="date"
                [(ngModel)]="form.fecha_hasta"
              />
            </div>

            <div class="form-group">
              <label for="horar">Horas</label>
              <input id="horar" type="number" [(ngModel)]="form.horar" placeholder="Opcional" />
            </div>

            <div class="form-group">
              <label for="cargos">Cargos</label>
              <input
                id="cargos"
                type="number"
                [(ngModel)]="form.cargos"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="id_cargo">Cargo</label>
              <app-searchable-select
                id="id_cargo"
                [options]="cargosOptions()"
                placeholder="Seleccionar cargo..."
                [(value)]="form.id_cargo"
              />
            </div>

            <div class="form-group">
              <label for="id_funcion">Función</label>
              <app-searchable-select
                id="id_funcion"
                [options]="funcionesOptions()"
                placeholder="Seleccionar función..."
                [(value)]="form.id_funcion"
              />
            </div>

            <div class="form-group">
              <label for="id_turno">Turno</label>
              <app-searchable-select
                id="id_turno"
                [options]="turnosOptions()"
                placeholder="Seleccionar turno..."
                [(value)]="form.id_turno"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="destino_anterior">Destino Anterior</label>
              <input
                id="destino_anterior"
                type="text"
                [(ngModel)]="form.destino_anterior"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="destino_nuevo">Destino Nuevo</label>
              <input
                id="destino_nuevo"
                type="text"
                [(ngModel)]="form.destino_nuevo"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="id_resolucion">Resolución Ministerial</label>
              <app-searchable-select
                id="id_resolucion"
                [options]="resolucionesOptions()"
                placeholder="Seleccionar resolución..."
                [(value)]="form.id_resolucion"
              />
            </div>

            <div class="form-group">
              <label for="resolucion_ministerial_ext">Res. Ministerial Ext.</label>
              <input
                id="resolucion_ministerial_ext"
                type="text"
                [(ngModel)]="form.resolucion_ministerial_ext"
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
                [(ngModel)]="form.resolucion_ministerial_rect1"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="resolucion_ministerial_rect2">Resolución Ministerial Rect. 2</label>
              <input
                id="resolucion_ministerial_rect2"
                type="text"
                [(ngModel)]="form.resolucion_ministerial_rect2"
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
                [(ngModel)]="form.disposicion_sgnij"
                placeholder="Opcional"
              />
            </div>

            <div class="form-group">
              <label for="rect_disposoco_sgnij">Rectificación</label>
              <input
                id="rect_disposoco_sgnij"
                type="text"
                [(ngModel)]="form.rect_disposoco_sgnij"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              rows="3"
              [(ngModel)]="form.observaciones"
              placeholder="Opcional"
            ></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            [disabled]="saving()"
            (click)="onSave()"
          >
            @if (saving()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              {{ editando() ? 'Guardar cambios' : 'Guardar instrumento' }}
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
      max-width: 680px;
      max-height: 90vh;
      overflow: visible;
    }

    .dialog-body {
      max-height: 60vh;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
    }

    .form-group input[type='text'],
    .form-group input[type='date'],
    .form-group input[type='number'],
    .form-group textarea,
    .historial-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      width: 100%;
      box-sizing: border-box;
    }

    .form-group input[type='text']:focus,
    .form-group input[type='date']:focus,
    .form-group input[type='number']:focus,
    .form-group textarea:focus,
    .historial-select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .field-error {
      font-size: 0.75rem;
      color: var(--destructive);
    }

    .radio-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      background: var(--surface);
      transition: border-color 0.2s ease;
    }

    .radio-item:hover {
      border-color: var(--primary);
    }

    .radio-item input[type='radio'] {
      margin-top: 0.25rem;
      accent-color: var(--primary);
    }

    .radio-item span {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .radio-item strong {
      font-size: 0.875rem;
      color: var(--foreground);
    }

    .radio-item small {
      font-size: 0.75rem;
      color: var(--muted-foreground);
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
      border: none;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      line-height: 1;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--accent);
      color: var(--foreground);
    }

    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
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
export class AgregarInstrumentoDialogComponent {
  private readonly proyeccionesService = inject(ProyeccionesService);
  private readonly alertService = inject(AlertService);
  private readonly cargosService = inject(CargosService);
  private readonly funcionesService = inject(FuncionesService);
  private readonly turnosService = inject(TurnosService);
  private readonly resolucionesService = inject(ResolucionesService);

  isOpen = input.required<boolean>();
  proyeccion = input<Proyeccion | null>(null);
  instrumentos = input<ProyeccionInstrumento[]>([]);
  /** Instrumento a editar (modo edición). Null = modo "agregar año nuevo". */
  editando = input<ProyeccionInstrumento | null>(null);
  closed = output<void>();
  saved = output<void>();

  modo = signal<ModoAgregar>('copiar_anterior');
  anioHistorial = signal<number | null>(null);
  saving = signal(false);

  form = {
    anio: '',
    estado: null as string | null,
    motivo: null as string | null,
    n_expediente: null as string | null,
    orden: null as number | null,
    fecha_desde: null as string | null,
    fecha_hasta: null as string | null,
    horar: null as number | null,
    cargos: null as number | null,
    id_cargo: null as number | null,
    id_funcion: null as number | null,
    id_turno: null as number | null,
    destino_anterior: null as string | null,
    destino_nuevo: null as string | null,
    id_resolucion: null as number | null,
    resolucion_ministerial_ext: null as string | null,
    disposicion_sgnij: null as string | null,
    rect_disposoco_sgnij: null as string | null,
    resolucion_previa_continuidad: null as string | null,
    resolucion_ministerial_rect1: null as string | null,
    resolucion_ministerial_rect2: null as string | null,
    observaciones: null as string | null,
  };

  // Catálogos (para los selects)
  cargos = signal<Cargo[]>([]);
  funciones = signal<{ id: number; nombre: string }[]>([]);
  turnos = signal<{ id: number; nombre: string }[]>([]);
  resoluciones = signal<{ id: number; nombre: string }[]>([]);

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

  readonly historialAnios = computed(() =>
    this.instrumentos()
      .map((i) => Number(i.anio))
      .filter((a) => !isNaN(a))
      .sort((a, b) => b - a)
  );

  readonly ultimoAnioDisponible = computed(() => {
    const anios = this.historialAnios();
    return anios.length > 0 ? anios[0] : this.proyeccion()?.['año'] ?? null;
  });

  readonly anioSugerido = computed(() => {
    const base = this.ultimoAnioDisponible();
    if (base !== null && base !== undefined) return String(Number(base) + 1);
    return String(new Date().getFullYear() + 1);
  });

  readonly anioError = signal('');

  private readonly resetOnOpen = effect(() => {
    if (this.isOpen()) {
      untracked(() => {
        this.reset();
        this.loadCatalogos();
      });
    }
  });

  private reset(): void {
    const editing = this.editando();
    if (editing) {
      // Modo edición: cargar los datos del instrumento
      const { anio, estado, motivo, n_expediente, orden, fecha_desde, fecha_hasta, horar,
        cargos, id_cargo, id_funcion, id_turno, destino_anterior, destino_nuevo,
        id_resolucion, resolucion_ministerial, resolucion_ministerial_ext, disposicion_sgnij,
        rect_disposoco_sgnij, resolucion_previa_continuidad, resolucion_ministerial_rect1,
        resolucion_ministerial_rect2, observaciones } = editing;
      this.form = {
        anio,
        estado: estado ?? null,
        motivo: motivo ?? null,
        n_expediente: n_expediente ?? null,
        orden: orden ?? null,
        fecha_desde: this.formatDateForInput(fecha_desde),
        fecha_hasta: this.formatDateForInput(fecha_hasta),
        horar: horar ?? null,
        cargos: cargos ?? null,
        id_cargo: id_cargo ?? null,
        id_funcion: id_funcion ?? null,
        id_turno: id_turno ?? null,
        destino_anterior: destino_anterior ?? null,
        destino_nuevo: destino_nuevo ?? null,
        id_resolucion: id_resolucion ?? null,
        resolucion_ministerial_ext: resolucion_ministerial_ext ?? null,
        disposicion_sgnij: disposicion_sgnij ?? null,
        rect_disposoco_sgnij: rect_disposoco_sgnij ?? null,
        resolucion_previa_continuidad: resolucion_previa_continuidad ?? null,
        resolucion_ministerial_rect1: resolucion_ministerial_rect1 ?? null,
        resolucion_ministerial_rect2: resolucion_ministerial_rect2 ?? null,
        observaciones: observaciones ?? null,
      };
      // `resolucion_ministerial` no se edita — la relación apunta a id_resolucion.
      void resolucion_ministerial;
    } else {
      // Modo agregar: año sugerido + datos base según el origen elegido
      this.modo.set('copiar_anterior');
      const anios = this.historialAnios();
      this.anioHistorial.set(anios.length > 0 ? anios[0] : null);
      this.form.anio = this.anioSugerido();
      this.aplicarOrigenAlForm();
    }
    this.anioError.set('');
    this.saving.set(false);
  }

  /**
   * Rellena el formulario con los datos del origen elegido
   * (copiar del último año / elegir del historial / crear en blanco).
   */
  private aplicarOrigenAlForm(): void {
    const base = this.buscarSnapshotBase();
    this.form = {
      ...this.form,
      // En "crear en blanco" el año también arranca vacío; en los otros
      // modos se sugiere el próximo año disponible.
      anio: this.modo() === 'nuevo' ? '' : this.anioSugerido(),
      estado: base.estado ?? null,
      motivo: base.motivo ?? null,
      n_expediente: base.n_expediente ?? null,
      orden: base.orden ?? null,
      fecha_desde: this.formatDateForInput(base.fecha_desde),
      fecha_hasta: this.formatDateForInput(base.fecha_hasta),
      horar: base.horar ?? null,
      cargos: base.cargos ?? null,
      id_cargo: base.id_cargo ?? null,
      id_funcion: base.id_funcion ?? null,
      id_turno: base.id_turno ?? null,
      destino_anterior: base.destino_anterior ?? null,
      destino_nuevo: base.destino_nuevo ?? null,
      id_resolucion: base.id_resolucion ?? null,
      resolucion_ministerial_ext: base.resolucion_ministerial_ext ?? null,
      disposicion_sgnij: base.disposicion_sgnij ?? null,
      rect_disposoco_sgnij: base.rect_disposoco_sgnij ?? null,
      resolucion_previa_continuidad: base.resolucion_previa_continuidad ?? null,
      resolucion_ministerial_rect1: base.resolucion_ministerial_rect1 ?? null,
      resolucion_ministerial_rect2: base.resolucion_ministerial_rect2 ?? null,
      observaciones: base.observaciones ?? null,
    };
  }

  /** Al cambiar el modo de origen o el año del historial (solo agregar),
   *  re-cargar los campos. Se dispara desde el template con (ngModelChange)
   *  porque el componente es zoneless: un effect no garantiza el re-render. */
  onModoChange(modo: ModoAgregar): void {
    this.modo.set(modo);
    if (!this.isOpen() || this.editando() || this.saving()) return;
    if (modo === 'historial' && this.anioHistorial() === null) return;
    this.aplicarOrigenAlForm();
  }

  onAnioHistorialChange(anio: number | null): void {
    this.anioHistorial.set(anio);
    if (!this.isOpen() || this.editando() || this.saving()) return;
    if (this.modo() !== 'historial' || anio === null) return;
    this.aplicarOrigenAlForm();
  }

  private loadCatalogos(): void {
    this.cargosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.cargos.set(Array.isArray(data) ? data : [data]);
      },
      error: () => this.cargos.set([]),
    });
    this.funcionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.funciones.set(Array.isArray(data) ? data.reduce((acc: any[], f: any) => acc.concat(Array.isArray(f) ? f : [f]), []) : []);
      },
      error: () => this.funciones.set([]),
    });
    this.turnosService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.turnos.set(Array.isArray(data) ? data.reduce((acc: any[], t: any) => acc.concat(Array.isArray(t) ? t : [t]), []) : []);
      },
      error: () => this.turnos.set([]),
    });
    this.resolucionesService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.resoluciones.set(Array.isArray(data) ? data.reduce((acc: any[], r: any) => acc.concat(Array.isArray(r) ? r : [r]), []) : []);
      },
      error: () => this.resoluciones.set([]),
    });
  }

  private formatDateForInput(date: string | null | undefined): string | null {
    if (!date) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  }

  private baseDeProyeccion(): Partial<PayloadProyeccionInstrumento> {
    const p = this.proyeccion();
    if (!p) return {};
    return {
      estado: p.estado ?? null,
      motivo: p.motivo ?? null,
      n_expediente: p.n_expediente ?? null,
      orden: p.orden !== null && p.orden !== undefined ? Number(p.orden) : null,
      fecha_desde: p.fecha_desde ?? null,
      fecha_hasta: p.fecha_hasta ?? null,
      horar: p.horar ?? null,
      cargos: p.cargos ?? null,
      id_cargo: p.id_cargo ?? null,
      id_funcion: p.id_funcion ?? null,
      id_turno: p.id_turno ?? null,
      resolucion_ministerial: p.resolucion_ministerial ?? null,
      resolucion_ministerial_ext: p.resolucion_ministerial_ext ?? null,
      disposicion_sgnij: p.disposicion_sgnij ?? null,
      rect_disposoco_sgnij: p.rect_disposoco_sgnij ?? null,
      resolucion_previa_continuidad: p.resolucion_previa_continuidad ?? null,
      resolucion_ministerial_rect1: p.resolucion_ministerial_rect1 ?? null,
      resolucion_ministerial_rect2: p.resolucion_ministerial_rect2 ?? null,
      destino_anterior: p.destino_anterior ?? null,
      destino_nuevo: p.destino_nuevo ?? null,
    };
  }

  private buscarSnapshotBase(): Partial<PayloadProyeccionInstrumento> {
    if (this.modo() === 'nuevo') {
      // Crear en blanco: formulario vacío, no se copia nada.
      return {};
    }
    const anioOrigen =
      this.modo() === 'historial'
        ? this.anioHistorial()
        : this.historialAnios()[0] ?? null;
    const snapshot = this.snapshotDeAnio(anioOrigen);
    if (!snapshot) {
      return this.baseDeProyeccion();
    }
    return {
      estado: snapshot.estado ?? null,
      motivo: snapshot.motivo ?? null,
      n_expediente: snapshot.n_expediente ?? null,
      orden: snapshot.orden ?? null,
      fecha_desde: snapshot.fecha_desde ?? null,
      fecha_hasta: snapshot.fecha_hasta ?? null,
      horar: snapshot.horar ?? null,
      cargos: snapshot.cargos ?? null,
      id_cargo: snapshot.id_cargo ?? null,
      id_funcion: snapshot.id_funcion ?? null,
      id_turno: snapshot.id_turno ?? null,
      resolucion_ministerial: snapshot.resolucion_ministerial ?? null,
      resolucion_ministerial_ext: snapshot.resolucion_ministerial_ext ?? null,
      disposicion_sgnij: snapshot.disposicion_sgnij ?? null,
      rect_disposoco_sgnij: snapshot.rect_disposoco_sgnij ?? null,
      resolucion_previa_continuidad: snapshot.resolucion_previa_continuidad ?? null,
      resolucion_ministerial_rect1: snapshot.resolucion_ministerial_rect1 ?? null,
      resolucion_ministerial_rect2: snapshot.resolucion_ministerial_rect2 ?? null,
      destino_anterior: snapshot.destino_anterior ?? null,
      destino_nuevo: snapshot.destino_nuevo ?? null,
    };
  }

  private snapshotDeAnio(anio: number | null): ProyeccionInstrumento | undefined {
    if (anio === null) return undefined;
    return this.instrumentos().find((i) => Number(i.anio) === anio);
  }

  onCancel(): void {
    this.closed.emit();
  }

  private buildPayload(): PayloadProyeccionInstrumento {
    return {
      anio: this.form.anio,
      estado: this.form.estado,
      motivo: this.form.motivo,
      n_expediente: this.form.n_expediente,
      orden: this.form.orden,
      fecha_desde: this.form.fecha_desde,
      fecha_hasta: this.form.fecha_hasta,
      horar: this.form.horar,
      cargos: this.form.cargos,
      id_cargo: this.form.id_cargo,
      id_funcion: this.form.id_funcion,
      id_turno: this.form.id_turno,
      destino_anterior: this.form.destino_anterior,
      destino_nuevo: this.form.destino_nuevo,
      id_resolucion: this.form.id_resolucion,
      resolucion_ministerial_ext: this.form.resolucion_ministerial_ext,
      disposicion_sgnij: this.form.disposicion_sgnij,
      rect_disposoco_sgnij: this.form.rect_disposoco_sgnij,
      resolucion_previa_continuidad: this.form.resolucion_previa_continuidad,
      resolucion_ministerial_rect1: this.form.resolucion_ministerial_rect1,
      resolucion_ministerial_rect2: this.form.resolucion_ministerial_rect2,
      observaciones: this.form.observaciones,
    };
  }

  onSave(): void {
    const anioTrim = (this.form.anio ?? '').trim();
    if (!anioTrim) {
      this.anioError.set('El año es obligatorio.');
      return;
    }
    const anioNum = Number(anioTrim);
    if (isNaN(anioNum) || anioNum < 1900 || anioNum > 2100) {
      this.anioError.set('Ingresá un año válido (ej: 2027).');
      return;
    }

    const proyeccionId = this.proyeccion()?.id;
    if (!proyeccionId) {
      this.alertService.error('Error', 'No se pudo identificar la proyección');
      return;
    }

    const editing = this.editando();
    if (editing) {
      // Edición: permite cambiar el año, pero sin chocar con otro instrumento de la misma proyección
      const chocaOtro = this.instrumentos().some(
        (i) => i.anio === anioTrim && i.id !== editing.id
      );
      if (chocaOtro) {
        this.anioError.set(`Ya existe un instrumento para el año ${anioTrim}.`);
        return;
      }
      this.anioError.set('');

      this.saving.set(true);
      this.proyeccionesService
        .updateInstrumento(proyeccionId, editing.id, this.buildPayload())
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.alertService.success('Instrumento actualizado', `Snapshot para ${anioTrim} guardado correctamente`);
            this.closed.emit();
            this.saved.emit();
          },
          error: (err: any) => {
            this.saving.set(false);
            const mensaje = err.error?.errors?.anio?.[0] ?? err.error?.message ?? 'Ocurrió un error al guardar';
            this.alertService.error('Error', mensaje);
          },
        });
      return;
    }

    // Agregar: el formulario ya viene precargado según el origen elegido
    if (this.modo() === 'historial' && this.anioHistorial() === null) {
      this.anioError.set('Seleccioná un año del historial.');
      return;
    }
    if (this.instrumentos().some((i) => i.anio === anioTrim)) {
      this.anioError.set(`Ya existe un instrumento para el año ${anioTrim}.`);
      return;
    }
    this.anioError.set('');

    const payload = this.buildPayload();
    this.saving.set(true);
    this.proyeccionesService.createInstrumento(proyeccionId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.alertService.success('Instrumento agregado', `Snapshot para ${anioTrim} guardado correctamente`);
        this.closed.emit();
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        const mensaje = err.error?.errors?.anio?.[0] ?? err.error?.message ?? 'Ocurrió un error al guardar';
        this.alertService.error('Error', mensaje);
      },
    });
  }
}