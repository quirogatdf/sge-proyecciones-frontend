import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { CrudTableComponent } from './crud-table.component';
import { CrudTableConfig, SearchFieldOption } from '../../interfaces/crud-config.interface';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';

interface Row {
  id: number;
  nombre: string;
}

const CAMPOS: SearchFieldOption[] = [
  { key: '__all__', label: 'Todos los campos' },
  { key: 'id', label: 'ID de proyección', origen: 'plaza', tipo: 'numero' },
  { key: 'n_expediente', label: 'N° de expediente', origen: 'instrumento', tipo: 'texto' },
];

/** Mock del servicio CRUD. Graba una copia de los params de cada `getAll`. */
function crearServicioMock(extraParams?: Record<string, unknown>) {
  const llamadas: Record<string, unknown>[] = [];
  return {
    llamadas,
    getExtraParams: () => extraParams,
    getAll: (params: Record<string, unknown>) => {
      // Copia: el componente reutiliza el mismo objeto entre llamadas.
      llamadas.push({ ...params });
      return of({
        data: [] as Row[],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
      });
    },
    delete: () => of(undefined),
  };
}

type ServicioMock = ReturnType<typeof crearServicioMock>;

/**
 * Últimos params enviados.
 *
 * Devuelve un objeto concreto (y no `| undefined` de `.at()`) para que las
 * aserciones compilen con los tipos de Jasmine que carga tsconfig.integration.json.
 */
function ultimaLlamada(servicio: ServicioMock): Record<string, unknown> {
  return servicio.llamadas[servicio.llamadas.length - 1];
}

const CONFIG_BASE: CrudTableConfig<Row> = {
  title: 'Proyecciones',
  serverSide: true,
  pageSize: 25,
  columns: [{ key: 'nombre', label: 'Nombre' }],
};

describe('CrudTableComponent — búsqueda por campo', () => {
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Monta el componente con los inputs ya seteados (ngOnInit corre en el primer detectChanges). */
  function montar(
    config: CrudTableConfig<Row>,
    extraParams?: Record<string, unknown>,
    opciones?: SearchFieldOption[],
  ) {
    const servicio = crearServicioMock(extraParams);

    const fixture = TestBed.createComponent(CrudTableComponent<Row>);
    fixture.componentInstance.config = config;
    fixture.componentInstance.service = servicio;
    if (opciones) fixture.componentRef.setInput('searchFieldOptions', opciones);
    fixture.detectChanges();

    return { fixture, cmp: fixture.componentInstance, servicio };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlertService, useValue: { error: () => {}, confirm: () => of(true) } },
        { provide: AuthService, useValue: { isAdmin: () => false, getToken: () => null } },
      ],
    });
  });

  // ─────────────────────────── el picker ───────────────────────────

  it('toma la PRIMERA opción como campo por defecto, sin conocer "__all__"', () => {
    const { cmp } = montar(CONFIG_BASE, undefined, CAMPOS);

    expect(cmp.effectiveSearchField()).toBe('__all__');
    expect(cmp.hasSearchFieldPicker()).toBe(true);
    expect(cmp.searchFieldSelectOptions()).toEqual([
      { id: '__all__', label: 'Todos los campos' },
      { id: 'id', label: 'ID de proyección' },
      { id: 'n_expediente', label: 'N° de expediente' },
    ]);
  });

  it('sin searchFieldOptions no renderiza el picker ni manda el param', () => {
    const { fixture, cmp, servicio } = montar({ ...CONFIG_BASE });

    expect(cmp.hasSearchFieldPicker()).toBe(false);
    expect(cmp.searchField()).toBeNull();
    expect(fixture.nativeElement.innerHTML).not.toContain('searchFieldPicker');
    expect('search_field' in ultimaLlamada(servicio)).toBe(false);
  });

  it('renderiza el picker cuando las opciones llegan DESPUÉS del mount', async () => {
    // Este es el caso que Antes no cubría y por eso el dropdown no aparecía:
    // las opciones llegan por HTTP, o sea después de ngOnInit.
    const { fixture, cmp, servicio } = montar(CONFIG_BASE);

    expect(cmp.hasSearchFieldPicker()).toBe(false);
    expect(fixture.nativeElement.innerHTML).not.toContain('searchFieldPicker');
    expect(cmp.effectiveSearchField()).toBeNull();

    // Llega la respuesta.
    fixture.componentRef.setInput('searchFieldOptions', CAMPOS);
    fixture.detectChanges();

    expect(cmp.hasSearchFieldPicker()).toBe(true);
    expect(fixture.nativeElement.innerHTML).toContain('searchFieldPicker');
    // El default se resuelve solo: no hay que setearlo a mano.
    expect(cmp.effectiveSearchField()).toBe('__all__');

    // Y ahora sí viaja en la request. `onSearch` es debounced: sin debounce el
    // default sigue siendo 350 ms y no hay llamada todavía.
    servicio.llamadas.length = 0;
    cmp.onSearch('123');
    await dormir(400);
    expect(ultimaLlamada(servicio)['search_field']).toBe('__all__');
  });

  it('el override del usuario sobrevive a un refresh de las opciones', () => {
    const { fixture, cmp } = montar(CONFIG_BASE, undefined, CAMPOS);
    cmp.onSearchFieldChange('id');

    fixture.componentRef.setInput('searchFieldOptions', CAMPOS);
    fixture.detectChanges();

    expect(cmp.effectiveSearchField()).toBe('id');
  });

  // ─────────────────────────── layout ───────────────────────────

  it('pone el picker a la izquierda del input, en la misma fila', () => {
    const { fixture } = montar(CONFIG_BASE, undefined, CAMPOS);

    const box = (fixture.nativeElement as HTMLElement).querySelector('.search-box')!;

    // Fila, no columna: el host de app-searchable-select es block y sin flex
    // se caía a una línea aparte.
    const boxStyle = getComputedStyle(box);
    expect(boxStyle.display).toBe('flex');
    expect(boxStyle.flexDirection).not.toBe('column');

    // Orden real en el DOM: el picker precede al input.
    const picker = box.querySelector('.search-field-picker')!;
    const input = box.querySelector('input.search-input')!;
    expect(picker).toBeTruthy();
    expect(input).toBeTruthy();
    expect(picker.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('sin picker, el input queda solo en la fila', () => {
    const { fixture } = montar(CONFIG_BASE);

    const box = (fixture.nativeElement as HTMLElement).querySelector('.search-box')!;
    expect(box.querySelector('.search-field-picker')).toBeNull();
    expect(box.querySelectorAll('input.search-input').length).toBe(1);
  });

  it('onSearchFieldChange manda search_field y resetea la página', () => {
    const { cmp, servicio } = montar(CONFIG_BASE, undefined, CAMPOS);
    servicio.llamadas.length = 0;

    cmp.currentPage.set(4);
    cmp.onSearchFieldChange('n_expediente');

    const ultima = ultimaLlamada(servicio);
    expect(ultima['search_field']).toBe('n_expediente');
    expect(ultima['page']).toBe(1);
  });

  it('respeta searchFieldParamName custom', () => {
    const { cmp, servicio } = montar(
      { ...CONFIG_BASE, searchFieldParamName: 'campo' },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.onSearchFieldChange('id');

    const ultima = ultimaLlamada(servicio);
    expect(ultima['campo']).toBe('id');
    expect('search_field' in ultima).toBe(false);
  });

  // ───────────────────── precedencia sobre getExtraParams ─────────────────────

  it('search y search_field ganan a un getExtraParams que manda las mismas claves', () => {
    const { cmp, servicio } = montar(
      { ...CONFIG_BASE, searchDebounceMs: 0 },
      { search: 'DEL-EXTRAS', search_field: 'del_extras', anio: '2026' },
      CAMPOS,
    );

    cmp.onSearchFieldChange('id');
    cmp.onSearch('1234');

    const ultima = ultimaLlamada(servicio);
    expect(ultima['search']).toBe('1234');
    expect(ultima['search_field']).toBe('id');
    // Los filtros que NO chocan se conservan.
    expect(ultima['anio']).toBe('2026');
  });

  // ─────────────────────────── debounce ───────────────────────────

  it('agrupa N keystrokes en UNA sola request', async () => {
    const { cmp, servicio } = montar(
      {
        ...CONFIG_BASE,
        searchDebounceMs: 60,
      },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.onSearch('a');
    cmp.onSearch('ab');
    cmp.onSearch('abc');

    // Antes del debounce todavía no hubo request.
    expect(servicio.llamadas.length).toBe(0);

    await dormir(150);

    expect(servicio.llamadas.length).toBe(1);
    expect(servicio.llamadas[0]['search']).toBe('abc');
  });

  it('searchDebounceMs: 0 dispara una request por keystroke', () => {
    const { cmp, servicio } = montar(
      {
        ...CONFIG_BASE,
        searchDebounceMs: 0,
      },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.onSearch('a');
    cmp.onSearch('ab');
    cmp.onSearch('abc');

    expect(servicio.llamadas.length).toBe(3);
    expect(servicio.llamadas.map((c) => c['search'])).toEqual(['a', 'ab', 'abc']);
  });

  it('el término nuevo cancela el debounce pendiente', async () => {
    const { cmp, servicio } = montar(
      {
        ...CONFIG_BASE,
        searchDebounceMs: 60,
      },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.onSearch('primer');
    await dormir(30);
    cmp.onSearch('segundo'); // cancela el timer del primero
    await dormir(150);

    expect(servicio.llamadas.length).toBe(1);
    expect(servicio.llamadas[0]['search']).toBe('segundo');
  });

  it('ngOnDestroy limpia el debounce pendiente', async () => {
    const { cmp, servicio, fixture } = montar(
      {
        ...CONFIG_BASE,
        searchDebounceMs: 60,
      },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.onSearch('huérfano');
    fixture.destroy();

    await dormir(150);

    expect(servicio.llamadas.length).toBe(0);
  });

  // ─────────────────────────── paginación ───────────────────────────

  it('reloadData() vuelve a la página 1', () => {
    const { cmp, servicio } = montar(CONFIG_BASE, undefined, CAMPOS);
    servicio.llamadas.length = 0;

    cmp.currentPage.set(5);
    cmp.reloadData();

    expect(cmp.currentPage()).toBe(1);
    expect(ultimaLlamada(servicio)['page']).toBe(1);
  });

  it('la búsqueda también vuelve a la página 1', () => {
    const { cmp, servicio } = montar(
      {
        ...CONFIG_BASE,
        searchDebounceMs: 0,
      },
      undefined,
      CAMPOS,
    );
    servicio.llamadas.length = 0;

    cmp.currentPage.set(7);
    cmp.onSearch('x');

    expect(ultimaLlamada(servicio)['page']).toBe(1);
  });
});
