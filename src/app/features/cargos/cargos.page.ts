import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { AlertService } from '../../core/services/alert.service';
import { CrudTableComponent } from '../../shared/components/crud-table/crud-table.component';
import { ColumnConfig, CrudTableConfig } from '../../shared/interfaces/crud-config.interface';
import { CargoFormSchema, type CargoFormInput } from '../../schemas/cargo.schema';

@Component({
  selector: 'app-cargos-page',
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
      [service]="cargosService"
      [saving]="saving"
      (modalOpened)="onModalOpened($event)"
      (save)="onSave(crudTable)"
    >
      <div form-content>
        <!-- El formulario SIEMPRE se muestra cuando el modal está abierto -->
        <div class="form-group" [class.has-error]="hasFieldError('codigo')">
          <label for="codigo">Código *</label>
          <input 
            id="codigo" 
            type="text" 
            [(ngModel)]="formData.codigo" 
            placeholder="Ej: 100"
            (input)="clearFieldError('codigo')"
          />
          @if (getFieldErrors('codigo').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('codigo'); track error) {
                <small class="error-text">{{ error }}</small>
              }
            </div>
          }
        </div>

        <div class="form-group" [class.has-error]="hasFieldError('nombre')">
          <label for="nombre">Nombre *</label>
          <input 
            id="nombre" 
            type="text" 
            [(ngModel)]="formData.nombre" 
            placeholder="Ej: Supervisor"
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

        <div class="form-group" [class.has-error]="hasFieldError('descripcion')">
          <label for="descripcion">Descripción</label>
          <input 
            id="descripcion" 
            type="text" 
            [(ngModel)]="formData.descripcion" 
            placeholder="Descripción opcional"
            (input)="clearFieldError('descripcion')"
          />
          @if (getFieldErrors('descripcion').length > 0) {
            <div class="error-messages">
              @for (error of getFieldErrors('descripcion'); track error) {
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
export class CargosPage {
  readonly cargosService = inject(CargosService);
  private readonly alertService = inject(AlertService);

  saving = signal(false);
  editingCargo = signal<Cargo | null>(null);
  
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});
  
  formData: CargoFormInput = {
    codigo: '',
    nombre: '',
    descripcion: ''
  };

  tableConfig: CrudTableConfig<Cargo> = {
    title: 'Administrar Cargos',
    pageSize: 25,
    searchPlaceholder: 'Buscar por código, nombre o descripción...',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'codigo', label: 'Código', sortable: true },
      { key: 'nombre', label: 'Nombre', sortable: true },
      { key: 'descripcion', label: 'Descripción', sortable: false }
    ],
    searchFields: ['codigo', 'nombre', 'descripcion']
  };

  onModalOpened(item: Cargo | null) {
    this.submitted.set(false);
    this.formErrors.set({});
    
    if (item) {
      // Editando
      this.editingCargo.set(item);
      this.formData = { 
        codigo: item.codigo, 
        nombre: item.nombre, 
        descripcion: item.descripcion || '' 
      };
    } else {
      // Nuevo
      this.editingCargo.set(null);
      this.formData = { codigo: '', nombre: '', descripcion: '' };
    }
  }

  onSave(crudTable: any) {
    this.submitted.set(true);
    
    const result = CargoFormSchema.safeParse(this.formData);

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
    
    const request = this.editingCargo()
      ? this.cargosService.update(this.editingCargo()!.id, data)
      : this.cargosService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.alertService.success(
          this.editingCargo() ? 'Cargo actualizado' : 'Cargo creado',
          'Los cambios se guardaron correctamente'
        );
        crudTable.closeModal();
        crudTable.reloadData();
      },
      error: (err) => {
        console.error('Error guardando cargo:', err);
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
