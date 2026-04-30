import { Component, inject, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';
import { NivelFormSchema, type NivelFormInput } from '../../schemas/nivel.schema';

@Component({
  selector: 'app-niveles-page',
  standalone: true,
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
      [service]="nivelesService"
      [saving]="saving"
      (modalOpened)="onModalOpened($event)"
      (save)="onSave(crudTable)"
    >
      <div form-content>
        <!-- El formulario SIEMPRE se muestra cuando el modal está abierto -->
        <div class="form-group" [class.has-error]="hasFieldError('nombre')">
          <label for="nombre">Nombre *</label>
          <input 
            id="nombre" 
            type="text" 
            [(ngModel)]="formData.nombre" 
            placeholder="Ej: Inicial"
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

        <div class="form-group" [class.has-error]="hasFieldError('sigla')">
          <label for="sigla">Sigla</label>
          <input 
            id="sigla" 
            type="text" 
            [(ngModel)]="formData.sigla" 
            placeholder="Ej: INI"
            maxlength="10"
            (input)="clearFieldError('sigla')"
          />
          @if (getFieldErrors('sigla').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('sigla'); track error) {
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

    .form-group input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      transition: border-color 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group.has-error input {
      border-color: var(--destructive);
    }

    .form-group.has-error input:focus {
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
export class NivelesPage {
  readonly nivelesService = inject(NivelesService);
  private readonly alertService = inject(AlertService);

  saving = signal(false);
  editingNivel = signal<Nivel | null>(null);
  
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});
  
  formData: NivelFormInput = {
    nombre: '',
    sigla: ''
  };

  tableConfig: CrudTableConfig<Nivel> = {
    title: 'Administrar Niveles',
    pageSize: 25,
    searchPlaceholder: 'Buscar por nombre o sigla...',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'nombre', label: 'Nombre', sortable: true },
      { key: 'sigla', label: 'Sigla', sortable: true }
    ],
    searchFields: ['nombre', 'sigla']
  };

  onModalOpened(item: Nivel | null) {
    this.submitted.set(false);
    this.formErrors.set({});
    
    if (item) {
      // Editando
      this.editingNivel.set(item);
      this.formData = { 
        nombre: item.nombre, 
        sigla: item.sigla === null ? '' : item.sigla 
      };
    } else {
      // Nuevo
      this.editingNivel.set(null);
      this.formData = { nombre: '', sigla: '' };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    
    const result = NivelFormSchema.safeParse(this.formData);

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
    
    const request = this.editingNivel()
      ? this.nivelesService.update(this.editingNivel()!.id, data)
      : this.nivelesService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.alertService.success(
          this.editingNivel() ? 'Nivel actualizado' : 'Nivel creado',
          'Los cambios se guardaron correctamente'
        );
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err) => {
        console.error('Error guardando nivel:', err);
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
