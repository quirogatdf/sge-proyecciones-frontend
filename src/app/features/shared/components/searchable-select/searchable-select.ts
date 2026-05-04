import {
  Component,
  input,
  model,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  inject,
} from '@angular/core';

import { DOCUMENT } from '@angular/common';

interface SelectOption {
  id: string | number;
  label: string;
}

let instanceCounter = 0;

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" #wrapper>
      <!-- Input principal con icono -->
      <div class="relative">
        <input
          #trigger
          type="text"
          [value]="searchQuery()"
          (input)="onSearch($event)"
          (focus)="open()"
          (keydown)="onKeydown($event)"
          [placeholder]="placeholder()"
          class="w-full px-3 py-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <!-- Icono Chevron Down -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>

      <!-- Dropdown con posicionamiento fixed -->
      @if (isOpen()) {
        <div
          [style.position]="'fixed'"
          [style.top.px]="dropdownTop()"
          [style.left.px]="dropdownLeft()"
          [style.width.px]="dropdownWidth()"
          class="z-50 bg-white border border-gray-300 max-h-60 overflow-y-auto rounded shadow-lg"
          #dropdown
        >
          @for (option of filteredOptions(); track option.id; let i = $index) {
            <div
              (click)="select(option)"
              [class.bg-blue-50]="i === highlightedIndex()"
              class="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {{ option.label }}
            </div>
          } @empty {
            <div class="px-3 py-2 text-gray-500">
              {{ loading() ? 'Cargando...' : 'No se encontraron resultados' }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SearchableSelectComponent {
  private static currentlyOpen: SearchableSelectComponent | null = null;

  private readonly document = inject(DOCUMENT);
  private readonly wrapper = viewChild<ElementRef<HTMLDivElement>>('wrapper');
  private readonly trigger = viewChild<ElementRef<HTMLInputElement>>('trigger');
  private readonly dropdownEl = viewChild<ElementRef<HTMLDivElement>>('dropdown');
  
  private readonly instanceId = `dropdown-${++instanceCounter}`;

  // Inputs y two-way binding (model)
  readonly options = input.required<SelectOption[]>();
  readonly loading = input(false);
  readonly placeholder = input('Seleccionar...');
  readonly value = model<number | string | null>(null);

  // Output para notificar cambios (útil para filtros)
  readonly valueChanged = output<number | string | null>();

  // Signals de estado
  readonly searchQuery = signal('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(0);
  
  // Posición del dropdown
  readonly dropdownTop = signal(0);
  readonly dropdownLeft = signal(0);
  readonly dropdownWidth = signal(0);

  // Handler para click fuera
  private clickHandler: ((event: MouseEvent) => void) | null = null;

  // Computed
  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const opts = this.options();
    if (!query) return opts;
    return opts.filter(o => o.label.toLowerCase().includes(query));
  });

  // Effects
  readonly filteredOptionsEffect = effect(() => {
    this.filteredOptions();
    this.highlightedIndex.set(0);
  });

  readonly valueEffect = effect(() => {
    const currentValue = this.value();
    const opts = this.options();
    if (currentValue != null) {
      const selected = opts.find(o => o.id === currentValue);
      if (selected) {
        this.searchQuery.set(selected.label);
      }
    } else {
      this.searchQuery.set('');
    }
  });

  // --- Métodos del dropdown ---

  open() {
    if (this.options().length === 0 && !this.loading()) return;
    
    // Si ya hay otro dropdown abierto, cerrarlo
    if (SearchableSelectComponent.currentlyOpen && 
        SearchableSelectComponent.currentlyOpen !== this) {
      SearchableSelectComponent.currentlyOpen.close(true); // true = restaurar searchQuery
    }
    
    // Registrarse como el dropdown abierto
    SearchableSelectComponent.currentlyOpen = this;
    
    // Limpiar búsqueda para mostrar TODAS las opciones
    this.searchQuery.set('');
    
    // Calcular posición del input
    const triggerEl = this.trigger()?.nativeElement;
    if (!triggerEl) return;
    
    const rect = triggerEl.getBoundingClientRect();
    this.dropdownTop.set(rect.bottom + window.scrollY);
    this.dropdownLeft.set(rect.left + window.scrollX);
    this.dropdownWidth.set(rect.width);
    
    this.isOpen.set(true);
    
    // Agregar listener para click outside después de un tick
    setTimeout(() => {
      this.clickHandler = (event: MouseEvent) => {
        const target = event.target as Node;
        const wrapperEl = this.wrapper()?.nativeElement;
        const dropdownEl = this.dropdownEl()?.nativeElement;
        
        // Verificar si el click fue dentro del wrapper o del dropdown
        const clickedInWrapper = wrapperEl?.contains(target) || false;
        const clickedInDropdown = dropdownEl?.contains(target) || false;
        
        if (!clickedInWrapper && !clickedInDropdown) {
          this.close(true); // true = restaurar searchQuery
        }
      };
      
      this.document.addEventListener('click', this.clickHandler, { capture: true });
    }, 0);
  }

  close(restoreSearchQuery: boolean = true) {
    this.isOpen.set(false);
    
    // Desregistrarse si somos el dropdown abierto
    if (SearchableSelectComponent.currentlyOpen === this) {
      SearchableSelectComponent.currentlyOpen = null;
    }
    
    // Restaurar el searchQuery si se pide
    if (restoreSearchQuery) {
      const currentValue = this.value();
      const opts = this.options();
      if (currentValue != null) {
        const selected = opts.find(o => o.id === currentValue);
        if (selected) {
          this.searchQuery.set(selected.label);
        }
      } else {
        this.searchQuery.set('');
      }
    }
    
    // Remover listener de click outside
    if (this.clickHandler) {
      this.document.removeEventListener('click', this.clickHandler, { capture: true });
      this.clickHandler = null;
    }
  }

  // --- Búsqueda ---

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    if (!this.isOpen() && value) {
      this.open();
    }
  }

  // --- Selección ---

  select(option: SelectOption) {
    this.value.set(option.id);
    this.searchQuery.set(option.label);
    this.valueChanged.emit(option.id);
    this.close(false); // false = no restaurar (ya tenemos el nuevo label)
  }

  private selectHighlighted() {
    const options = this.filteredOptions();
    const idx = this.highlightedIndex();
    if (options.length > 0 && idx >= 0 && idx < options.length) {
      this.select(options[idx]);
    }
  }

  // --- Navegación con teclado ---

  onKeydown(event: KeyboardEvent) {
    if (!this.isOpen()) {
      if (event.key === 'ArrowDown') {
        this.open();
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
      case 'Tab':
        this.close(true);
        if (event.key === 'Tab') return;
        event.preventDefault();
        break;
      case 'Enter':
        this.selectHighlighted();
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.highlightNext();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.highlightPrevious();
        event.preventDefault();
        break;
    }
  }

  private highlightNext() {
    const options = this.filteredOptions();
    if (options.length === 0) return;
    const nextIdx = (this.highlightedIndex() + 1) % options.length;
    this.highlightedIndex.set(nextIdx);
  }

  private highlightPrevious() {
    const options = this.filteredOptions();
    if (options.length === 0) return;
    const prevIdx = (this.highlightedIndex() - 1 + options.length) % options.length;
    this.highlightedIndex.set(prevIdx);
  }
}
