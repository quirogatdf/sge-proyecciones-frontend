import {
  Component,
  inject,
  input,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ColumnConfig, CrudTableConfig, SearchFieldOption, ServerSideCrudService } from '../../interfaces/crud-config.interface';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { SearchableSelectComponent } from '../searchable-select/searchable-select';
import {
  LucidePlus,
  LucidePencil,
  LucideTrash2,
  LucideEye,
  LucideX,
  LucideAArrowUp,
  LucideAArrowDown,
} from '@lucide/angular';

@Component({
  selector: 'app-crud-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SearchableSelectComponent,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideEye,
    LucideX,
    LucideAArrowUp,
    LucideAArrowDown,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="page-header-main">
          <h1>{{ config.title }}</h1>
          <div class="page-header-actions">
            <ng-content select="[crud-actions]"></ng-content>
            @if (authService.isAdmin()) {
              <button class="btn btn-primary" (click)="openModal()">
                <svg lucidePlus [size]="18"></svg>
                {{ config.createButtonLabel || 'Nuevo' }}
              </button>
            }
          </div>
        </div>
        <ng-content select="[crud-filters]"></ng-content>
      </header>

      <div class="table-container">
        <!-- Buscador: el picker "Buscar en" va a la izquierda del input. El orden
             en el template ya lo define; el CSS solo le da layout de fila. -->
        <div class="search-box">
          @if (hasSearchFieldPicker()) {
            <app-searchable-select
              id="searchFieldPicker"
              class="search-field-picker"
              [options]="searchFieldSelectOptions()"
              placeholder="Buscar en…"
              [value]="effectiveSearchField()"
              (valueChanged)="onSearchFieldChange($event)"
            />
          }
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
                  <span class="th-content flex flex-row items-center gap-1">
                    @if (col.sortable !== false && sortBy() === col.key) {
                      @if (sortDirection() === 'asc') {
                        <svg lucideAArrowDown class="sort-icon" [size]="18"></svg>
                      } @else {
                        <svg lucideAArrowUp class="sort-icon" [size]="18"></svg>
                      }
                    }
                    {{ col.label }}
                  </span>
                </th>
              }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (serverLoading()) {
              <tr>
                <td [attr.colspan]="config.columns.length + 1" class="empty">
                  Cargando...
                </td>
              </tr>
            } @else {
              @for (item of paginatedItems(); track item['id']) {
                <tr
                  [class.selected]="selectedId() === item['id']"
                  [style.cursor]="selectable !== false ? 'pointer' : undefined"
                  (click)="selectRow(item)"
                >
                  @for (col of config.columns; track col.key) {
                    <td>
                      @if (col.render) {
                        <div [innerHTML]="getCellHtml(item, col)"></div>
                      } @else {
                        {{ getCellValue(item, col) }}
                      }
                    </td>
                  }
                  <td class="actions" (click)="$event.stopPropagation()">
                    @if (config.showViewDetail) {
                      <button class="btn-icon" (click)="onViewDetail(item['id'])">
                        <svg lucideEye [size]="16"></svg>
                      </button>
                    }
                    @if (authService.isAdmin()) {
                      <button class="btn-icon" (click)="openModal(item)">
                        <svg lucidePencil [size]="16"></svg>
                      </button>
                      <button class="btn-icon btn-danger" (click)="deleteItem(item['id'])">
                        <svg lucideTrash2 [size]="16"></svg>
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr (click)="$event.stopPropagation()">
                  <td [attr.colspan]="config.columns.length + 1" class="empty">
                    No hay registros cargados
                  </td>
                </tr>
              }
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
              @if (config.serverSide && serverTotalItems() > 0) {
                <span class="total-info"> ({{ serverTotalItems() }} registros)</span>
              }
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
            <h2>{{ editingItem() ? getEditTitle() : getCreateTitle() }}</h2>
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
              {{ saving() ? 'Guardando...' : saveLabel }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
      }

      .page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        max-width: 100%;
      }

      .page-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .page-header-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .page-header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
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

      .btn svg {
        display: inline-block;
        flex-shrink: 0;
        vertical-align: middle;
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
        overflow-x: auto;
        max-width: 100%;
        width: 100%;
      }

      .table {
        border-collapse: collapse;
      }

      .table th,
      .table td {
        padding: 0.75rem 1rem;
        text-align: start;
        white-space: nowrap;
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

      .table tbody tr {
        transition: background-color 0.12s ease;
      }

      .table tbody tr:not(.selected):hover {
        background: color-mix(in oklch, var(--accent) 30%, transparent);
      }

      .table tbody tr.selected {
        background: color-mix(in oklch, var(--primary) 10%, transparent);
      }

      .table tbody tr.selected td:first-child {
        box-shadow: inset 3px 0 0 0 var(--primary);
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
         max-width: 800px;
         max-height: 90vh;
         display: flex;
         flex-direction: column;
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
         overflow-y: auto;
         max-height: calc(90vh - 130px);
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
        /* Picker + input en la MISMA fila: el host de app-searchable-select es
           block, asi que sin flex se come el ancho completo y lo manda abajo. */
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .search-box .search-field-picker {
        flex: 0 0 auto;
        width: 16rem;
      }

      .search-input {
        /* flex, no width:100% — con el picker al lado el 100% lo desbordaria. */
        flex: 1 1 auto;
        min-width: 0;
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

      .total-info {
        color: var(--muted-foreground);
        font-size: 0.8rem;
      }
    `,
  ],
})
export class CrudTableComponent<T extends { id: number }> implements OnInit, OnDestroy {
  private readonly alertService = inject(AlertService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly authService = inject(AuthService);

  @Input({ required: true }) config!: CrudTableConfig<T>;
  @Input({ required: true }) service!: any;

  /**
   * Opciones del picker "Buscar en".
   *
   * Signal input y NO parte de `config`, a proposito: las opciones llegan por HTTP
   * DESPUES de que el componente ya esta montado. Si vivieran en `config`, el
   * objeto se construiria capturando el array por VALOR (`[]` en ese momento) y
   * ademas los computeds del componente leen propiedades planas, asi que nunca se
   * recalcularian al llegar los datos. Ese combo es exactamente por lo que el
   * dropdown no aparecia.
   */
  readonly searchFieldOptions = input<SearchFieldOption[]>([]);

  /**
   * Predicado opcional para filtrar filas en modo client-side.
   *
   * Se recibe como input (no dentro de `config`) para que el consumidor pueda
   * reconstruirlo cuando cambie su propio estado de filtros y el computed de
   * `filteredItems` se recalcule.
   */
  readonly itemFilter = input<((item: T) => boolean) | null>(null);

  @Input() saving = signal(false);
  /** Texto del botón de guardar del footer (default: 'Guardar'). */
  @Input() saveLabel = 'Guardar';
  @Output() modalOpened = new EventEmitter<T | null>();
  @Output() save = new EventEmitter<T | null>();
  @Output() viewDetail = new EventEmitter<number>();
  @Output() rowSelected = new EventEmitter<T | null>();

  @Input() selectable?: boolean;

  selectedId = signal<number | null>(null);
  items = signal<T[]>([]);
  showModal = signal(false);
  editingItem = signal<T | null>(null);

  searchTerm = signal('');
  /** Campo de busqueda elegido por el usuario (null = usar el default). */
  readonly searchField = signal<string | null>(null);
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  currentPage = signal(1);
  sortBy = signal<keyof T | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Server-side pagination state
  serverTotalItems = signal(0);
  serverTotalPages = signal(1);
  serverLoading = signal(false);

  pageSize = computed(() => this.config.pageSize || 25);

  /**
   * Opciones del picker, en el formato que espera `SearchableSelectComponent`.
   *
   * El componente NO conoce el string `__all__`: el default es "la primera
   * opcion", y el backend ya pone el sentinel primero. Asi la decision no se
   * duplica en el frontend.
   */
  readonly searchFieldSelectOptions = computed<{ id: string; label: string }[]>(() =>
    this.searchFieldOptions().map((o) => ({ id: o.key, label: o.label })),
  );

  /** Hay picker de campo disponible? Si no, la busqueda sigue igual. */
  readonly hasSearchFieldPicker = computed(() => this.searchFieldOptions().length > 0);

  /**
   * Campo que se manda al backend.
   *
   * `searchField()` es el override explicito del usuario; si todavia no eligio
   * nada, cae a la PRIMERA opcion. Se resuelve con un `computed` en vez de un
   * setter en `ngOnInit` porque las opciones llegan despues del mount: si se
   * calculara "una vez", quedaria clavado en `null` para siempre y el backend
   * nunca recibiria `search_field`.
   */
  readonly effectiveSearchField = computed(() => this.searchField() ?? this.searchFieldOptions()[0]?.key ?? null);

  // Client-side filtered items
  filteredItems = computed(() => {
    // If server-side, don't do client-side filtering
    if (this.config.serverSide) return this.items();

    const filter = this.itemFilter();
    const search = this.searchTerm().toLowerCase();
    const items = filter ? this.items().filter((item) => filter(item)) : this.items();
    if (!search) return items;

    // Determine which fields to search in
    const fieldsToSearch = this.config.searchFields
      ? this.config.searchFields
      : this.config.columns.flatMap(col => col.searchFields || [col.key]);

    // Build a map of field -> column for columns with render functions
    const renderColumns = new Map<string, ColumnConfig<T>>();
    this.config.columns.forEach(col => {
      if (col.render) {
        renderColumns.set(col.key as string, col);
        if (col.searchFields) {
          col.searchFields.forEach(f => renderColumns.set(f, col));
        }
      }
    });

    return items.filter(item => {
      return fieldsToSearch.some(field => {
        // Check if this field has a render function
        const col = renderColumns.get(field);
        if (col?.render) {
          const rendered = col.render(item);
          if (typeof rendered === 'string') {
            const text = this.stripHtml(rendered).toLowerCase();
            return text.includes(search);
          }
          return false;
        }

        // Otherwise, search in the raw value
        const value = item[field as keyof T];
        return value != null && String(value).toLowerCase().includes(search);
      });
    });
  });

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  sortedItems = computed(() => {
    // If server-side, don't do client-side sorting
    if (this.config.serverSide) return this.filteredItems();
    
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
        cmp = String(valA || '')
          .toLowerCase()
          .localeCompare(String(valB || '').toLowerCase());
      }

      return direction === 'asc' ? cmp : -cmp;
    });

    return items;
  });

  totalPages = computed(() => {
    if (this.config.serverSide) return this.serverTotalPages();
    return Math.max(1, Math.ceil(this.sortedItems().length / this.pageSize()));
  });

  paginatedItems = computed(() => {
    if (this.config.serverSide) return this.sortedItems();
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedItems().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    // El default del campo NO se setea aca: se resuelve en `effectiveSearchField`
    // para que tambien funcione si las opciones llegan despues del mount.
    this.loadItems();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceHandle !== null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }

  loadItems() {
    if (this.config.serverSide) {
      this.loadServerSide();
    } else {
      (this.service as any).getAll().subscribe({
        next: (res: any) => {
          const data = res.data;
          this.items.set(Array.isArray(data) ? data : [data]);
        },
        error: (err: any) => console.error('Error cargando datos:', err),
      });
    }
  }

  private loadServerSide() {
    this.serverLoading.set(true);
    const params: Record<string, unknown> = {
      page: this.currentPage(),
      per_page: this.pageSize(),
    };

    const sortBy = this.sortBy();
    const sortDir = this.sortDirection();
    if (sortBy) {
      params['sort_by'] = sortBy as string;
      params['sort_dir'] = sortDir;
    }

    // Add any extra params from the service wrapper
    const extraParams = this.service?.getExtraParams?.();
    if (extraParams) Object.assign(params, extraParams);

    // `search` y el campo se escriben DESPUES del Object.assign de extras: son
    // estado de UI (la caja de texto y el picker), ellos tienen la ultima palabra.
    const search = this.searchTerm();
    if (search) params['search'] = search;

    const field = this.effectiveSearchField();
    if (this.hasSearchFieldPicker() && field) {
      params[this.config.searchFieldParamName ?? 'search_field'] = field;
    }

    (this.service as ServerSideCrudService<T>).getAll(params).subscribe({
      next: (res: any) => {
        this.items.set(res.data);
        this.serverTotalItems.set(res.meta.total);
        this.serverTotalPages.set(res.meta.last_page);
        this.currentPage.set(res.meta.current_page);
        this.serverLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando datos:', err);
        this.serverLoading.set(false);
      },
    });
  }

  /**
   * Recarga el listado desde la primera pagina.
   *
   * El reset es parte del contrato: en la pagina 5, cambiar anio/nivel pedia la
   * pagina 5 del conjunto nuevo -> tabla vacia. `deleteItem()` NO usa este metodo
   * a proposito: despues de borrar conviene quedarse en la pagina actual.
   */
  reloadData() {
    this.currentPage.set(1);
    this.loadItems();
  }

  /**
   * Debounce imperativo con `setTimeout`, no `effect()`.
   *
   * La app es zoneless (`provideZonelessChangeDetection()`) y el propio codebase
   * lo deja escrito en agregar-instrumento-dialog.component.ts: un `effect()` no
   * garantiza el re-render, por eso los handlers se disparan desde el template.
   * `SearchableSelectComponent` usa exactamente este patron.
   */
  onSearch(term: string) {
    if (this.searchDebounceHandle !== null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }

    const ms = this.config.searchDebounceMs ?? 350;
    if (ms <= 0) {
      this.aplicarBusqueda(term);
      return;
    }

    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      this.aplicarBusqueda(term);
    }, ms);
  }

  private aplicarBusqueda(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    if (this.config.serverSide) {
      this.loadServerSide();
    }
  }

  /** El picker es un filtro, no un campo: cambiarlo no re-tipea el termino. */
  onSearchFieldChange(value: number | string | null) {
    this.searchField.set(value === null ? null : String(value));
    this.currentPage.set(1);
    if (this.config.serverSide) {
      this.loadServerSide();
    }
  }

  onSort(field: keyof T) {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
    if (this.config.serverSide) {
      this.currentPage.set(1);
      this.loadServerSide();
      return;
    }
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
      if (this.config.serverSide) {
        this.loadServerSide();
      }
    }
  }

  /** Vuelve a la primera página (útil cuando cambia un filtro externo). */
  resetPage(): void {
    this.currentPage.set(1);
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

  onViewDetail(id: number) {
    this.viewDetail.emit(id);
  }

  selectRow(item: T) {
    if (this.selectable === false) return;

    if (this.selectedId() === item['id']) {
      this.selectedId.set(null);
      this.rowSelected.emit(null);
    } else {
      this.selectedId.set(item['id']);
      this.rowSelected.emit(item);
    }
  }

  deleteItem(id: number) {
    this.alertService
      .confirm('¿Eliminar registro?', 'Esta acción no se puede deshacer', 'Eliminar', 'Cancelar')
      .then((result) => {
        if (result.isConfirmed) {
          (this.service as any).delete(id).subscribe({
            next: () => {
              this.loadItems();
              this.alertService.success('Eliminado', 'El registro fue eliminado');
            },
            error: (err: any) => {
              console.error('Error eliminando:', err);
              this.alertService.error('Error', 'No se pudo eliminar el registro');
            },
          });
        }
      });
  }

  getCellValue(item: T, col: ColumnConfig<T>): string {
    if (col.render) {
      const result = col.render(item);
      // Si devuelve un string con HTML, lo devolvemos tal cual
      // El template usará getCellHtml() para renderizarlo
      return typeof result === 'string' ? result : String(result);
    }
    const value = item[col.key];
    return value !== null && value !== undefined ? String(value) : '-';
  }

  getCellHtml(item: T, col: ColumnConfig<T>): SafeHtml | null {
    if (col.render) {
      const result = col.render(item);
      if (typeof result === 'string') {
        return this.sanitizer.bypassSecurityTrustHtml(result);
      }
    }
    return null;
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

  /** Título del modal al crear (configurable; respeta el género). */
  getCreateTitle(): string {
    return this.config.createTitle ?? `Nuevo ${this.getEntityName()}`;
  }

  /** Título del modal al editar (configurable). */
  getEditTitle(): string {
    return this.config.editTitle ?? `Editar ${this.getEntityName()}`;
  }
}
