import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InstitucionesService, Institucion } from '../../core/services/instituciones.service';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { AlertService } from '../../core/services/alert.service';
import { LucidePlus, LucidePencil, LucideTrash2, LucideX, LucideSearch } from '@lucide/angular';
import { InstitucionFormSchema, type InstitucionFormInput } from '../../schemas/institucion.schema';

@Component({
  selector: 'app-instituciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideX,
    LucideSearch,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Administrar Instituciones</h1>
        <button class="btn btn-primary" (click)="openModal()">
          <svg lucidePlus [size]="18"></svg>
          Nueva Institución
        </button>
      </header>

      <!-- Búsqueda -->
      <div class="search-container">
        <svg lucideSearch [size]="18" class="search-icon"></svg>
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          placeholder="Buscar por nombre, descripción o CUISE..."
          class="search-input"
        />
      </div>

      <!-- Tabla -->
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CUISE</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Nivel</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (institucion of paginatedInstituciones(); track institucion.id) {
              <tr>
                <td>{{ institucion.id }}</td>
                <td>{{ institucion['cuise'] || '-' }}</td>
                <td>{{ institucion.nombre }}</td>
                <td>{{ institucion.localidad }}</td>
                <td>{{ institucion.nivel?.nombre || 'Sin nivel' }}</td>
                <td class="actions">
                  <button class="btn-icon" (click)="openModal(institucion)">
                    <svg lucidePencil [size]="16"></svg>
                  </button>
                  <button class="btn-icon btn-danger" (click)="deleteInstitucion(institucion.id)">
                    <svg lucideTrash2 [size]="16"></svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">
                  {{
                    searchQuery() ? 'No se encontraron resultados' : 'No hay instituciones cargadas'
                  }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button
            class="btn-icon"
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() === 1"
          >
            ←
          </button>

          @for (page of pageNumbers(); track page) {
            @if (page === '...') {
              <span class="pagination-ellipsis">...</span>
            } @else {
              <button
                class="pagination-btn"
                [class.active]="currentPage() === page"
                (click)="goToPage(page)"
              >
                {{ page }}
              </button>
            }
          }

          <button
            class="btn-icon"
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
          >
            →
          </button>

          <span class="pagination-info">
            Página {{ currentPage() }} de {{ totalPages() }} ({{ filteredInstituciones().length }}
            registros)
          </span>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2>{{ editingInstitucion() ? 'Editar' : 'Nueva' }} Institución</h2>
              <button class="btn-icon" (click)="closeModal()">
                <svg lucideX [size]="20"></svg>
              </button>
            </header>
            <div class="modal-body">
              <!-- Campo CUISE (opcional) -->
              <div class="form-group">
                <label for="cuise">CUISE *</label>
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

              <!-- Campo Nombre (obligatorio) -->
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

              <!-- Campo Ciudad (obligatorio) -->
              <div class="form-group" [class.has-error]="hasFieldError('localidad')">
                <label for="localidad">Ciudad *</label>
                <select
                  id="localidad"
                  [(ngModel)]="formData.localidad"
                  (change)="clearFieldError('localidad')"
                  class="form-select"
                >
                  <option value="">Seleccione una ciudad...</option>
                  <option value="Rio Grande">Río Grande</option>
                  <option value="Ushuaia">Ushuaia</option>
                  <option value="Tolhuin">Tolhuin</option>
                </select>
                @if (getFieldErrors('localidad').length > 0) {
                  <div class="error-messages">
                    @for (error of getFieldErrors('localidad'); track error) {
                      <small class="error-text">{{ error }}</small>
                    }
                  </div>
                }
              </div>

              <!-- Campo Nivel (obligatorio) -->
              <div class="form-group" [class.has-error]="hasFieldError('nivel_id')">
                <label for="nivel_id">Nivel *</label>
                <select
                  id="nivel_id"
                  [ngModel]="formData.nivel_id"
                  (ngModelChange)="formData.nivel_id = $event; clearFieldError('nivel_id')"
                  class="form-select"
                >
                  <option [ngValue]="null">Seleccione un nivel...</option>
                  @for (nivel of niveles(); track nivel.id) {
                    <option [ngValue]="nivel.id">
                      {{ nivel.nombre }} ({{ nivel.sigla || 'Sin sigla' }})
                    </option>
                  }
                </select>
                @if (getFieldErrors('nivel_id').length > 0) {
                  <div class="error-messages">
                    @for (error of getFieldErrors('nivel_id'); track error) {
                      <small class="error-text">{{ error }}</small>
                    }
                  </div>
                }
              </div>

              <!-- Campo Anexo (opcional) -->
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
  styles: [
    `
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

      /* Paginación */
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        flex-wrap: wrap;
      }

      .pagination-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        color: var(--foreground);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      .pagination-btn:hover {
        background: var(--accent);
      }

      .pagination-btn.active {
        background: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
      }

      .pagination-ellipsis {
        color: var(--muted-foreground);
      }

      .pagination-info {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin-left: 1rem;
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

      .btn-icon:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
        max-width: 500px;
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

      /* Estilos para errores */
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
    `,
  ],
})
export class InstitucionesPage implements OnInit {
  private readonly institucionesService = inject(InstitucionesService);
  private readonly nivelesService = inject(NivelesService);
  private readonly alertService = inject(AlertService);

  instituciones = signal<Institucion[]>([]);
  niveles = signal<Nivel[]>([]); // Para el desplegable de niveles
  showModal = signal(false);
  editingInstitucion = signal<Institucion | null>(null);
  saving = signal(false);
  searchQuery = signal('');

  // Paginación
  currentPage = signal(1);
  readonly pageSize = 25; // Máximo 25 registros por página

  // Validación
  submitted = signal(false);
  formErrors = signal<Record<string, string[]>>({});

  formData: InstitucionFormInput = {
    nombre: '',
    localidad: '' as any, // Se selecciona del desplegable
    nivel_id: undefined as any, // Se selecciona del desplegable
    cuise: '',
    anexo: '',
  };

  // Registros filtrados por búsqueda
  filteredInstituciones = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.instituciones();

    return this.instituciones().filter(
      (inst) =>
        inst.nombre.toLowerCase().includes(query) ||
        (inst['cuise']?.toLowerCase().includes(query) ?? false) ||
        (inst['anexo']?.toLowerCase().includes(query) ?? false),
    );
  });

  // Total de páginas
  totalPages = computed(() => {
    return Math.ceil(this.filteredInstituciones().length / this.pageSize);
  });

  // Registros paginados (25 por página)
  paginatedInstituciones = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredInstituciones().slice(startIndex, endIndex);
  });

  // Números de página para mostrar (con ellipsis)
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  });

  ngOnInit() {
    this.loadNiveles(); // Cargar niveles para el desplegable
    this.loadInstituciones();
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

  loadInstituciones() {
    this.institucionesService.getAll().subscribe({
      next: (res) => {
        const data = res.data;
        this.instituciones.set(Array.isArray(data) ? data : [data]);
        this.currentPage.set(1); // Resetear a página 1 si los datos cambian
      },
      error: (err) => console.error('Error cargando instituciones:', err),
    });
  }

  goToPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  openModal(institucion?: Institucion) {
    this.submitted.set(false);
    this.formErrors.set({});

    if (institucion) {
      this.editingInstitucion.set(institucion);
      this.formData = {
        nombre: institucion.nombre,
        localidad: institucion.localidad as any,
        nivel_id: institucion.nivel?.id || (institucion.nivel_id as any),
        cuise: institucion['cuise'] || '',
        anexo: institucion['anexo'] || '',
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
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingInstitucion.set(null);
    this.submitted.set(false);
    this.formErrors.set({});
  }

  save() {
    this.submitted.set(true);

    // Validar con Zod
    const result = InstitucionFormSchema.safeParse(this.formData);

    if (!result.success) {
      const flattened = result.error.flatten();
      console.log('Errores de validación:', flattened.fieldErrors);
      this.formErrors.set(flattened.fieldErrors as Record<string, string[]>);

      if (Object.keys(flattened.fieldErrors).length > 0) {
        this.alertService.error(
          'Error de validación',
          'Por favor corregí los errores en el formulario',
        );
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
        this.loadInstituciones();
        this.closeModal();
        this.saving.set(false);
        this.alertService.success(
          this.editingInstitucion() ? 'Institución actualizada' : 'Institución creada',
          'Los cambios se guardaron correctamente',
        );
      },
      error: (err) => {
        console.error('Error guardando:', err);
        this.saving.set(false);
        this.alertService.error('Error', 'No se pudieron guardar los cambios');
      },
    });
  }

  deleteInstitucion(id: number) {
    this.alertService
      .confirm('¿Eliminar institución?', 'Esta acción no se puede deshacer', 'Eliminar', 'Cancelar')
      .then((result) => {
        if (result.isConfirmed) {
          this.institucionesService.delete(id).subscribe({
            next: () => {
              this.loadInstituciones();
              this.alertService.success('Eliminado', 'La institución fue eliminada');
            },
            error: (err) => {
              console.error('Error eliminando:', err);
              this.alertService.error('Error', 'No se pudo eliminar la institución');
            },
          });
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
