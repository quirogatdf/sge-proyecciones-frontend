import { 
  Component, 
  inject, 
  signal, 
  computed, 
  OnInit, 
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ColumnConfig, 
  CrudService, 
  CrudTableConfig 
} from '../../interfaces/crud-config.interface';
import { AlertService } from '../../../core/services/alert.service';
import { LucidePlus, LucidePencil, LucideTrash2, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-crud-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucidePlus, LucidePencil, LucideTrash2, LucideX],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>{{ config.title }}</h1>
        <button class="btn btn-primary" (click)="openModal()">
          <svg lucidePlus [size]="18"></svg>
          Nuevo
        </button>
      </header>

      <div class="table-container">
        <!-- Buscador -->
        <div class="search-box">
          <input 
            type="text" 
            [placeholder]="config.searchPlaceholder || 'Buscar...'"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearch($event)"
            class="search-input"
          />
        </div>

        <table class="table">
          <thead>
            <tr>
              @for (col of config.columns; track col.key) {
                <th 
                  [class.sortable]="col.sortable !== false"
                  (click)="col.sortable !== false && onSort(col.key)"
                >
                  {{ col.label }} 
                  @if (col.sortable !== false) {
                    {{ getSortIcon(col.key) }}
                  }
                </th>
              }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (item of paginatedItems(); track item['id']) {
              <tr>
                @for (col of config.columns; track col.key) {
                  <td>{{ getCellValue(item, col) }}</td>
                }
                <td class="actions">
                  <button class="btn-icon" (click)="openModal(item)">
                    <svg lucidePencil [size]="16"></svg>
                  </button>
                  <button class="btn-icon btn-danger" (click)="deleteItem(item['id'])">
                    <svg lucideTrash2 [size]="16"></svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="config.columns.length + 1" class="empty">
                  No hay registros cargados
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Paginación -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button 
              class="btn-page" 
              (click)="onPageChange(currentPage() - 1)"
              [disabled]="currentPage() === 1"
            >
              Anterior
            </button>
            
            <span class="page-info">
              Página {{ currentPage() }} de {{ totalPages() }}
            </span>
            
            <button 
              class="btn-page" 
              (click)="onPageChange(currentPage() + 1)"
              [disabled]="currentPage() >= totalPages()"
            >
              Siguiente
            </button>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h2>{{ editingItem() ? 'Editar' : 'Nuevo' }} {{ getEntityName() }}</h2>
            <button class="btn-icon" (click)="closeModal()">
              <svg lucideX [size]="20"></svg>
            </button>
          </header>
          <div class="modal-body">
            <ng-content select="[form-content]"></ng-content>
          </div>
          <footer class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="onSaveClick()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </div>
      </div>
    }
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
      color: var(--muted-foreground);
      text-transform: uppercase;
    }

    .table td {
      border-block-end: 1px solid var(--border);
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

    .search-box {
      padding: 1rem;
      border-block-end: 1px solid var(--border);
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .sortable {
      cursor: pointer;
      user-select: none;
      transition: color 0.2s ease;
    }

    .sortable:hover {
      color: var(--primary);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-block-start: 1px solid var(--border);
    }

    .btn-page {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--foreground);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-page:hover:not(:disabled) {
      background: var(--accent);
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }
  `]
})
export class CrudTableComponent<T extends { id: number }> implements OnInit {
  private readonly alertService = inject(AlertService);

  @Input({ required: true }) config!: CrudTableConfig<T>;
  @Input({ required: true }) service!: any;
  @Input() saving = signal(false);
  @Output() modalOpened = new EventEmitter<T | null>();
  @Output() save = new EventEmitter<T | null>();

  items = signal<T[]>([]);
  showModal = signal(false);
  editingItem = signal<T | null>(null);
  
  searchTerm = signal('');
  currentPage = signal(1);
  sortBy = signal<keyof T | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  pageSize = computed(() => this.config.pageSize || 25);

  filteredItems = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const items = this.items();
    if (!search) return items;
    
    const searchFields = this.config.searchFields || 
      this.config.columns
        .filter(col => col.searchFields || col.sortable !== false)
        .flatMap(col => col.searchFields || [col.key]);
    
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field as keyof T];
        return value && String(value).toLowerCase().includes(search);
      })
    );
  });

  sortedItems = computed(() => {
    const items = [...this.filteredItems()];
    const sortBy = this.sortBy();
    if (!sortBy) return items;
    
    const direction = this.sortDirection();
    
    items.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA || '').toLowerCase().localeCompare(String(valB || '').toLowerCase());
      }
      
      return direction === 'asc' ? cmp : -cmp;
    });
    
    return items;
  });

  totalPages = computed(() => 
    Math.max(1, Math.ceil(this.sortedItems().length / this.pageSize()))
  );

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedItems().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    (this.service as any).getAll().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.items.set(Array.isArray(data) ? data : [data]);
      },
      error: (err: any) => console.error('Error cargando datos:', err)
    });
  }

  reloadData() {
    this.loadItems();
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  onSort(field: keyof T) {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  getSortIcon(field: keyof T): string {
    if (this.sortBy() !== field) return '↕️';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  openModal(item?: T) {
    if (item) {
      this.editingItem.set({ ...item });
    } else {
      this.editingItem.set(null);
    }
    this.showModal.set(true);
    this.modalOpened.emit(this.editingItem() as T | null);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingItem.set(null);
  }

  onSaveClick() {
    this.save.emit(this.editingItem() as T | null);
  }

  deleteItem(id: number) {
    this.alertService.confirm(
      '¿Eliminar registro?',
      'Esta acción no se puede deshacer',
      'Eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        (this.service as any).delete(id).subscribe({
          next: () => {
            this.loadItems();
            this.alertService.success('Eliminado', 'El registro fue eliminado');
          },
          error: (err: any) => {
            console.error('Error eliminando:', err);
            this.alertService.error('Error', 'No se pudo eliminar el registro');
          }
        });
      }
    });
  }

  getCellValue(item: T, col: ColumnConfig<T>): string {
    if (col.render) {
      return col.render(item);
    }
    const value = item[col.key];
    return value !== null && value !== undefined ? String(value) : '-';
  }

  getEntityName(): string {
    const title = this.config.title.toLowerCase();
    if (title.includes('función') || title.includes('funcion')) return 'Función/Perfil';
    if (title.includes('cargo')) return 'Cargo';
    if (title.includes('sector')) return 'Sector';
    if (title.includes('institución') || title.includes('institucion')) return 'Institución';
    if (title.includes('nivel')) return 'Nivel';
    if (title.includes('turno')) return 'Turno';
    return 'Registro';
  }
}
