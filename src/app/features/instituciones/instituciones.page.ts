import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitucionesService, Institucion } from '../../core/services/instituciones.service';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { SearchableSelectComponent } from '../shared/components/searchable-select/searchable-select';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';
import { InstitucionFormSchema, type InstitucionFormInput } from '../../schemas/institucion.schema';

interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'app-instituciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CrudTableComponent,
    SearchableSelectComponent
  ],
  template: `
    <app-crud-table
      #crudTable
      [config]="tableConfig"
      [service]="institucionesService"
      [saving]="saving"
      (modalOpened)="onModalOpened($event)"
      (save)="onSave(crudTable)"
    >
      <div form-content>
        <!-- CUISE -->
        <div class="form-group">
          <label for="cuise">CUISE</label>
          <input
            id="cuise"
            type="text"
            [(ngModel)]="formData['cuise']"
            placeholder="Ej: 12345"
            (input)="clearFieldError('cuise')"
          />
          @if (getFieldErrors('cuise').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('cuise'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <!-- Nombre -->
        <div class="form-group" [class.has-error]="hasFieldError('nombre')">
          <label for="nombre">Nombre *</label>
          <input
            id="nombre"
            type="text"
            [(ngModel)]="formData.nombre"
            placeholder="Ej: Escuela N° 1"
            (input)="clearFieldError('nombre')"
          />
          @if (getFieldErrors('nombre').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('nombre'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <!-- Ciudad -->
        <div class="form-group" [class.has-error]="hasFieldError('localidad')">
          <label for="localidad">Ciudad *</label>
          <app-searchable-select
            id="localidad"
            [options]="localidadOptions()"
            placeholder="Seleccione una ciudad..."
            [(value)]="formData.localidad"
            (valueChange)="clearFieldError('localidad')"
          />
          @if (getFieldErrors('localidad').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('localidad'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <!-- Nivel -->
        <div class="form-group" [class.has-error]="hasFieldError('nivel_id')">
          <label for="nivel_id">Nivel *</label>
          <app-searchable-select
            id="nivel_id"
            [options]="nivelesOptions()"
            placeholder="Seleccione un nivel..."
            [(value)]="formData.nivel_id"
          />
          @if (getFieldErrors('nivel_id').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('nivel_id'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <!-- Anexo -->
        <div class="form-group">
          <label for="anexo">Anexo</label>
          <input
            id="anexo"
            type="text"
            [(ngModel)]="formData['anexo']"
            placeholder="Anexo (opcional, máx 20 caracteres)"
            (input)="clearFieldError('anexo')"
          />
          @if (getFieldErrors('anexo').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('anexo'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>
      </div>
    </app-crud-table>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
    }

    .form-group input,
    .form-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      transition: border-color 0.2s ease;
    }

    .form-select {
      appearance: auto;
    }

    .form-group input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group.has-error input,
    .form-group.has-error .form-select {
      border-color: var(--destructive);
    }

    .form-group.has-error input:focus,
    .form-group.has-error .form-select:focus {
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
  `]
})
export class InstitucionesPage implements OnInit {
  readonly institucionesService = inject(InstitucionesService);
  readonly nivelesService = inject(NivelesService);
  private readonly alertService = inject(AlertService);

  niveles = signal<Nivel[]>([]);
  saving = signal(false);

  // Opciones estáticas para localidad
  readonly localidadOptions = signal<SelectOption[]>([
    { id: 'Rio Grande', label: 'Río Grande' },
    { id: 'Ushuaia', label: 'Ushuaia' },
    { id: 'Tolhuin', label: 'Tolhuin' }
  ]);

  // Opciones computadas para niveles
  readonly nivelesOptions = computed(() => 
    this.niveles().map(n => ({ id: n.id, label: `${n.nombre} (${n.sigla || 'Sin sigla'})` }))
  );
  editingInstitucion = signal<Institucion | null>(null);
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});
  
  formData: InstitucionFormInput = {
    nombre: '',
    localidad: '' as any,
    nivel_id: undefined as any,
    cuise: '',
    anexo: '',
  };

  tableConfig: CrudTableConfig<Institucion> = {
    title: 'Administrar Instituciones',
    pageSize: 25,
    searchPlaceholder: 'Buscar por nombre, CUISE o anexo...',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'cuise', label: 'CUISE', sortable: true, render: (item) => item['cuise'] || '-' },
      { key: 'nombre', label: 'Nombre', sortable: true },
      { key: 'localidad', label: 'Ciudad', sortable: true },
      { 
        key: 'nivel', 
        label: 'Nivel', 
        sortable: false,
        render: (item: Institucion) => item.nivel?.nombre || 'Sin nivel'
      }
    ],
    searchFields: ['nombre', 'cuise', 'anexo']
  };

  ngOnInit() {
    this.loadNiveles();
  }

  loadNiveles() {
    this.nivelesService.getAll().subscribe({
      next: (res) => {
        const data = res.data;
        this.niveles.set(Array.isArray(data) ? data : [data]);
      },
      error: (err) => console.error('Error cargando niveles:', err),
    });
  }

  onModalOpened(item: Institucion | null) {
    this.submitted.set(false);
    this.formErrors.set({});
    
    if (item) {
      this.editingInstitucion.set(item);
      this.formData = {
        nombre: item.nombre,
        localidad: item.localidad as any,
        nivel_id: item.nivel?.id || (item.nivel_id as any),
        cuise: item['cuise'] || '',
        anexo: item['anexo'] || '',
      };
    } else {
      this.editingInstitucion.set(null);
      this.formData = {
        nombre: '',
        localidad: '' as any,
        nivel_id: undefined as any,
        cuise: '',
        anexo: '',
      };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    
    const result = InstitucionFormSchema.safeParse(this.formData);

    if (!result.success) {
      const flattened = result.error.flatten();
      this.formErrors.set(flattened.fieldErrors as Record<string, string[]>);
      
      if (Object.keys(flattened.fieldErrors).length > 0) {
        this.alertService.error('Error de validación', 'Por favor corregí los errores en el formulario');
      }
      return;
    }

    this.formErrors.set({});
    this.saving.set(true);
    
    const data = result.data;
    
    const request = this.editingInstitucion()
      ? this.institucionesService.update(this.editingInstitucion()!.id, data)
      : this.institucionesService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.alertService.success(
          this.editingInstitucion() ? 'Institución actualizada' : 'Institución creada',
          'Los cambios se guardaron correctamente'
        );
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err) => {
        console.error('Error guardando institución:', err);
        this.saving.set(false);
        this.alertService.error('Error', 'No se pudieron guardar los cambios');
      }
    });
  }

  hasFieldError(field: string): boolean {
    return this.submitted() && (this.formErrors()[field]?.length || 0) > 0;
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
