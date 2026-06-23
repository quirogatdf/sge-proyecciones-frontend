import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResolucionesService, Resolucion } from '../../core/services/resoluciones.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';
import { ResolucionFormSchema, type ResolucionFormInput } from '../../schemas/resolucion.schema';

@Component({
  selector: 'app-resoluciones-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CrudTableComponent
  ],
  template: `
    <app-crud-table
      #crudTable
      [config]="tableConfig"
      [service]="resolucionesService"
      [saving]="saving"
      (modalOpened)="onModalOpened($event)"
      (save)="onSave(crudTable)"
      (viewDetail)="onViewDetail($event)"
    >
      <div form-content>
        <div class="form-group" [class.has-error]="hasFieldError('nombre')">
          <label for="nombre">Nombre *</label>
          <input 
            id="nombre" 
            type="text" 
            [(ngModel)]="formData.nombre" 
            placeholder="Ej: Resolución N° 1234/2026"
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

        <div class="form-group" [class.has-error]="hasFieldError('año')">
          <label for="año">Año *</label>
          <input 
            id="año" 
            type="number" 
            [(ngModel)]="formData['año']" 
            placeholder="Ej: 2026"
            (input)="clearFieldError('año')"
          />
          @if (getFieldErrors('año').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('año'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <div class="form-group" [class.has-error]="hasFieldError('observacion')">
          <label for="observacion">Observación</label>
          <textarea 
            id="observacion" 
            [(ngModel)]="formData.observacion" 
            placeholder="Descripción opcional..."
            rows="3"
            (input)="clearFieldError('observacion')"
          ></textarea>
          @if (getFieldErrors('observacion').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('observacion'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <div class="form-group" [class.has-error]="hasFieldError('url')">
          <label for="url">URL del documento</label>
          <input 
            id="url" 
            type="url" 
            [(ngModel)]="formData.url" 
            placeholder="https://ejemplo.com/resolucion.pdf"
            (input)="clearFieldError('url')"
          />
          @if (getFieldErrors('url').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('url'); track error) {
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
    .form-group textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group.has-error input,
    .form-group.has-error textarea {
      border-color: var(--destructive);
    }

    .form-group.has-error input:focus,
    .form-group.has-error textarea:focus {
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
export class ResolucionesPage {
  readonly resolucionesService = inject(ResolucionesService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);

  saving = signal(false);
  editingResolucion = signal<Resolucion | null>(null);
  
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});
  
  formData: ResolucionFormInput = {
    nombre: '',
    año: new Date().getFullYear(),
    observacion: null,
    url: null
  };

  tableConfig: CrudTableConfig<Resolucion> = {
    title: 'Administrar Resoluciones',
    pageSize: 25,
    searchPlaceholder: 'Buscar por nombre o año...',
    showViewDetail: true,
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'nombre', label: 'Nombre', sortable: true },
      { key: 'año', label: 'Año', sortable: true },
      {
        key: 'url',
        label: 'URL',
        sortable: true,
        render: (item) => item.url
          ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:500;color:var(--primary);text-decoration:none;border:1px solid var(--border);cursor:pointer" onclick="event.stopPropagation()">Ver PDF</a>`
          : '-'
      }
    ],
    searchFields: ['nombre', 'año']
  };

  onModalOpened(item: Resolucion | null) {
    this.submitted.set(false);
    this.formErrors.set({});
    
    if (item) {
      this.editingResolucion.set(item);
      this.formData = { 
        nombre: item.nombre, 
        año: item.año,
        observacion: item.observacion || '',
        url: item.url || ''
      };
    } else {
      this.editingResolucion.set(null);
      this.formData = { 
        nombre: '', 
        año: new Date().getFullYear(),
        observacion: '',
        url: ''
      };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    
    const result = ResolucionFormSchema.safeParse(this.formData);

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
    
    const request = this.editingResolucion()
      ? this.resolucionesService.update(this.editingResolucion()!.id, data)
      : this.resolucionesService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.alertService.success(
          this.editingResolucion() ? 'Resolución actualizada' : 'Resolución creada',
          'Los cambios se guardaron correctamente'
        );
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err: any) => {
        console.error('Error guardando resolución:', err);
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

  onViewDetail(id: number) {
    this.router.navigate(['/resoluciones', id]);
  }
}
