import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CargosService, Cargo } from '../../core/services/cargos.service';
import { AlertService } from '../../core/services/alert.service';
import { LucidePlus, LucidePencil, LucideTrash2, LucideX, LucideSearch } from '@lucide/angular';
import Swal from 'sweetalert2';
import { CargoFormSchema, type CargoFormInput } from '../../schemas/cargo.schema';

@Component({
  selector: 'app-cargos-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucidePlus, 
    LucidePencil, 
    LucideTrash2,
    LucideX,
    LucideSearch
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Administrar Cargos</h1>
        <button class="btn btn-primary" (click)="openModal()">
          <svg lucidePlus [size]="18"></svg>
          Nuevo Cargo
        </button>
      </header>

      <div class="search-container">
        <svg lucideSearch [size]="18" class="search-icon"></svg>
        <input 
          type="text" 
          [ngModel]="searchQuery()" 
          (ngModelChange)="searchQuery.set($event)"
          placeholder="Buscar por codigo, nombre o descripcion..."
          class="search-input"
        />
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (cargo of filteredCargos; track cargo.id) {
              <tr>
                <td>{{ cargo.id }}</td>
                <td>{{ cargo.codigo }}</td>
                <td>{{ cargo.nombre }}</td>
                <td>{{ cargo.descripcion || '-' }}</td>
                <td class="actions">
                  <button class="btn-icon" (click)="openModal(cargo)">
                    <svg lucidePencil [size]="16"></svg>
                  </button>
                  <button class="btn-icon btn-danger" (click)="deleteCargo(cargo.id)">
                    <svg lucideTrash2 [size]="16"></svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty">
                  {{ searchQuery() ? 'No se encontraron resultados' : 'No hay cargos cargados' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2>{{ editingCargo() ? 'Editar' : 'Nuevo' }} Cargo</h2>
              <button class="btn-icon" (click)="closeModal()">
                <svg lucideX [size]="20"></svg>
              </button>
            </header>
            <div class="modal-body">
              <!-- Campo Codigo (obligatorio) -->
              <div class="form-group" [class.has-error]="hasFieldError('codigo')">
                <label for="codigo">Codigo *</label>
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

              <!-- Campo Nombre (obligatorio) -->
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

              <!-- Campo Descripcion (opcional) -->
              <div class="form-group" [class.has-error]="hasFieldError('descripcion')">
                <label for="descripcion">Descripcion</label>
                <input 
                  id="descripcion" 
                  type="text" 
                  [(ngModel)]="formData.descripcion" 
                  placeholder="Descripcion opcional"
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
            <footer class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </footer>
          </div>
        </div>
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
      align-items: center;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--muted-foreground);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 0.5rem 0.75rem 0.5rem 2.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--surface);
      color: var(--foreground);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .search-input::placeholder {
      color: var(--muted-foreground);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
    }

    .btn-primary:hover {
      filter: brightness(1.1);
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.375rem;
      background: transparent;
      border: none;
      border-radius: var(--radius);
      color: var(--muted-foreground);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: var(--accent);
      color: var(--foreground);
    }

    .btn-icon.btn-danger:hover {
      background: color-mix(in oklch, var(--destructive) 15%, transparent);
      color: var(--destructive);
    }

    .table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 0.75rem 1rem;
      text-align: start;
    }

    .table th {
      background: var(--muted);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted-foreground);
    }

    .table td {
      border-block-end: 1px solid var(--border);
      font-size: 0.875rem;
    }

    .table tr:last-child td {
      border-block-end: none;
    }

    .table .actions {
      display: flex;
      gap: 0.25rem;
    }

    .table .empty {
      text-align: center;
      color: var(--muted-foreground);
      padding: 2rem;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .modal {
      background: var(--surface);
      border-radius: var(--radius);
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-block-end: 1px solid var(--border);
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-block-start: 1px solid var(--border);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
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

    /* Estilos para errores */
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

    .modal-loading {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted-foreground);
    }
  `]
})
export class CargosPage implements OnInit {
  private readonly cargosService = inject(CargosService);
  private readonly alertService = inject(AlertService);

  cargos = signal<Cargo[]>([]);
  showModal = signal(false);
  editingCargo = signal<Cargo | null>(null);
  saving = signal(false);
  searchQuery = signal('');
  
  // Nuevo: control de errores y envío
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});

  formData: CargoFormInput = {
    codigo: '',
    nombre: '',
    descripcion: ''
  };

  ngOnInit() {
    this.loadCargos();
  }

  get filteredCargos(): Cargo[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.cargos();
    
    return this.cargos().filter(cargo => 
      cargo.codigo.toLowerCase().includes(query) ||
      cargo.nombre.toLowerCase().includes(query) ||
      (cargo.descripcion?.toLowerCase().includes(query) ?? false)
    );
  }

  loadCargos() {
    this.cargosService.getAll().subscribe({
      next: (res) => {
        const data = res.data;
        this.cargos.set(Array.isArray(data) ? data : [data]);
      },
      error: (err) => console.error('Error cargando cargos:', err)
    });
  }

  openModal(cargo?: Cargo) {
    // Resetear estados de error
    this.submitted.set(false);
    this.formErrors.set({});

    if (cargo) {
      this.editingCargo.set(cargo);
      this.formData = { 
        codigo: cargo.codigo, 
        nombre: cargo.nombre, 
        descripcion: cargo.descripcion || '' 
      };
    } else {
      this.editingCargo.set(null);
      this.formData = { codigo: '', nombre: '', descripcion: '' };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCargo.set(null);
    this.submitted.set(false);
    this.formErrors.set({});
  }

  save() {
    console.log('save() llamado', this.formData);
    this.submitted.set(true);

    // Validar con Zod
    const result = CargoFormSchema.safeParse(this.formData);

    if (!result.success) {
      // Extraer errores de Zod y mapearlos al formulario
      const flattened = result.error.flatten();
      this.formErrors.set(flattened.fieldErrors as Record<string, string[]>);
      
      // Mostrar alerta general si hay errores
      if (Object.keys(flattened.fieldErrors).length > 0) {
        this.alertService.error('Error de validación', 'Por favor corregí los errores en el formulario');
      }
      return;
    }

    // Si pasa la validación, limpiar errores y guardar
    this.formErrors.set({});
    this.saving.set(true);
    
    const data = result.data; // Datos ya validados y transformados por Zod

    console.log('Enviando data validada:', data);

    const request = this.editingCargo()
      ? this.cargosService.update(this.editingCargo()!.id, data)
      : this.cargosService.create(data);

    request.subscribe({
      next: (res) => {
        console.log('Response:', res);
        this.loadCargos();
        this.closeModal();
        this.saving.set(false);
        this.alertService.success(
          this.editingCargo() ? 'Cargo actualizado' : 'Cargo creado',
          'Los cambios se guardaron correctamente'
        );
      },
      error: (err) => {
        console.error('Error:', err);
        this.saving.set(false);
        this.alertService.error('Error', 'No se pudieron guardar los cambios');
      }
    });
  }

  deleteCargo(id: number) {
    this.alertService.confirm(
      '¿Eliminar cargo?',
      'Esta accion no se puede deshacer',
      'Eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.cargosService.delete(id).subscribe({
          next: () => {
            this.loadCargos();
            this.alertService.success('Eliminado', 'El cargo fue eliminado');
          },
          error: (err) => {
            console.error('Error eliminando:', err);
            this.alertService.error('Error', 'No se pudo eliminar el cargo');
          }
        });
      }
    });
  }

  // Helper: verificar si un campo tiene errores
  hasFieldError(field: string): boolean {
    return this.submitted() && (this.formErrors()[field]?.length || 0) > 0;
  }

  // Helper: obtener errores de un campo
  getFieldErrors(field: string): string[] {
    return this.formErrors()[field] || [];
  }

  // Helper: limpiar error de un campo cuando el usuario empieza a escribir
  clearFieldError(field: string) {
    if (this.formErrors()[field]) {
      const newErrors = { ...this.formErrors() };
      delete newErrors[field];
      this.formErrors.set(newErrors);
    }
  }
}
