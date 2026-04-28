import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { AlertService } from '../../core/services/alert.service';
import { LucidePlus, LucidePencil, LucideTrash2, LucideX } from '@lucide/angular';
import { NivelFormSchema, type NivelFormInput } from '../../schemas/nivel.schema';

@Component({
  selector: 'app-niveles-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucidePlus, 
    LucidePencil, 
    LucideTrash2,
    LucideX
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Administrar Niveles</h1>
        <button class="btn btn-primary" (click)="openModal()">
          <svg lucidePlus [size]="18"></svg>
          Nuevo Nivel
        </button>
      </header>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Sigla</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (nivel of niveles(); track nivel.id) {
              <tr>
                <td>{{ nivel.id }}</td>
                <td>{{ nivel.nombre }}</td>
                <td>{{ nivel.sigla || '-' }}</td>
                <td class="actions">
                  <button class="btn-icon" (click)="openModal(nivel)">
                    <svg lucidePencil [size]="16"></svg>
                  </button>
                  <button class="btn-icon btn-danger" (click)="deleteNivel(nivel.id)">
                    <svg lucideTrash2 [size]="16"></svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">No hay niveles cargados</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          @defer {
            <div class="modal" (click)="$event.stopPropagation()">
              <header class="modal-header">
                <h2>{{ editingNivel() ? 'Editar' : 'Nuevo' }} Nivel</h2>
                <button class="btn-icon" (click)="closeModal()">
                  <svg lucideX [size]="20"></svg>
                </button>
              </header>
              <div class="modal-body">
                <!-- Campo Nombre (obligatorio) -->
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

                <!-- Campo Sigla (opcional) -->
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
              <footer class="modal-footer">
                <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar' }}
                </button>
              </footer>
            </div>
          } @placeholder {
            <div class="modal-loading">Cargando...</div>
          }
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
export class NivelesPage implements OnInit {
  private readonly nivelesService = inject(NivelesService);
  private readonly alertService = inject(AlertService);

  niveles = signal<Nivel[]>([]);
  showModal = signal(false);
  editingNivel = signal<Nivel | null>(null);
  saving = signal(false);
  
  // Nuevo: control de errores y envío
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});

  formData: NivelFormInput = {
    nombre: '',
    sigla: ''
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
      error: (err) => console.error('Error cargando niveles:', err)
    });
  }

  openModal(nivel?: Nivel) {
    // Resetear estados de error
    this.submitted.set(false);
    this.formErrors.set({});

    if (nivel) {
      this.editingNivel.set(nivel);
      this.formData = { 
        nombre: nivel.nombre, 
        sigla: nivel.sigla === null ? '' : nivel.sigla 
      };
    } else {
      this.editingNivel.set(null);
      this.formData = { nombre: '', sigla: '' };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingNivel.set(null);
    this.submitted.set(false);
    this.formErrors.set({});
  }

  save() {
    this.submitted.set(true);

    // Validar con Zod
    const result = NivelFormSchema.safeParse(this.formData);

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
    
    // DEBUG: Ver qué estamos enviando
    console.log('Guardando nivel:', {
      id: this.editingNivel()?.id,
      originalData: this.editingNivel(),
      formData: this.formData,
      validatedData: data
    });

    const request = this.editingNivel()
      ? this.nivelesService.update(this.editingNivel()!.id, data)
      : this.nivelesService.create(data);

    request.subscribe({
      next: (res) => {
        console.log('Respuesta del API (nivel):', res);
        this.loadNiveles();
        this.closeModal();
        this.saving.set(false);
        this.alertService.success(
          this.editingNivel() ? 'Nivel actualizado' : 'Nivel creado',
          'Los cambios se guardaron correctamente'
        );
      },
      error: (err) => {
        console.error('Error guardando nivel:', err);
        this.saving.set(false);
        this.alertService.error('Error', 'No se pudieron guardar los cambios');
      }
    });
  }

  deleteNivel(id: number) {
    this.alertService.confirm(
      '¿Eliminar nivel?',
      'Esta accion no se puede deshacer',
      'Eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.nivelesService.delete(id).subscribe({
          next: () => {
            this.loadNiveles();
            this.alertService.success('Eliminado', 'El nivel fue eliminado');
          },
          error: (err) => {
            console.error('Error eliminando:', err);
            this.alertService.error('Error', 'No se pudo eliminar el nivel');
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
