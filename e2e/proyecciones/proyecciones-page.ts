import { Page, Locator, expect } from '@playwright/test';

const CURRENT_YEAR = new Date().getFullYear().toString();

export class ProyeccionesPage {
  constructor(public readonly page: Page) {}

  // --- Header / tabla ---
  readonly createButton = () =>
    this.page.getByRole('button', { name: 'Nueva Proyección' });
  readonly exportButton = () =>
    this.page.getByRole('button', { name: 'Exportar Excel' });
  readonly searchInput = () => this.page.getByPlaceholder('Buscar proyecciones...');
  readonly yearFilterInput = () => this.page.locator('input[placeholder="Año actual"]');
  readonly rows = () => this.page.locator('tbody tr');

  // --- Modal ---
  readonly modal = () => this.page.locator('.modal');
  readonly modalTitle = () => this.modal().locator('header.modal-header h2');
  readonly cancelButton = () => this.modal().getByRole('button', { name: 'Cancelar' });

  // --- Campos del form ---
  readonly idPuestoInput = () => this.page.locator('#id_puesto');
  readonly anioInput = () => this.page.getByLabel('Año', { exact: true });
  readonly fechaDesdeInput = () => this.page.locator('#fecha_desde');
  readonly destinoNuevoInput = () => this.page.locator('#destino_nuevo');

  /** Inyecta el token de Sanctum ANTES de que Angular bootstrapee. */
  async authenticate(token: string): Promise<void> {
    await this.page.addInitScript((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
  }

  async goto(): Promise<void> {
    await this.page.goto('/proyecciones');
    await expect(this.createButton()).toBeVisible({ timeout: 20000 });
  }

  /** Espera a que la tabla termine de cargar (desaparece "Cargando..."). */
  async expectReady(): Promise<void> {
    await expect(this.page.getByText('Cargando...')).toHaveCount(0, {
      timeout: 20000,
    });
    await expect(this.rows().first()).toBeVisible();
  }

  /** El selector de año debe apuntar al año calendario actual por defecto. */
  async expectYearFilterDefault(): Promise<void> {
    await expect(this.yearFilterInput()).toHaveValue(CURRENT_YEAR);
  }

  async openCreateModal(): Promise<void> {
    await this.createButton().click();
    await this.expectModalTitle('Nueva Proyección');
  }

  async expectModalTitle(title: string): Promise<void> {
    await expect(this.modalTitle()).toHaveText(title);
  }

  async expectStepActive(label: string): Promise<void> {
    const step = this.modal().locator('.step', { hasText: label });
    await expect(step).toHaveClass(/active/);
  }

  async expectSaveButton(label: string): Promise<void> {
    await expect(this.modal().getByRole('button', { name: label })).toBeVisible();
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal()).toHaveCount(0, { timeout: 15000 });
  }

  /**
   * Interactúa con app-searchable-select: abre el dropdown y elige la opción.
   * Solo hay UN dropdown abierto a la vez (singleton en el componente).
   */
  async selectFromDropdown(input: Locator, optionText: string): Promise<void> {
    await input.click();
    const dropdown = this.page.locator('div.z-50:visible');
    await expect(dropdown).toBeVisible();
    await dropdown.getByText(optionText, { exact: true }).click();
  }

  async selectNivel(label: string): Promise<void> {
    await this.selectFromDropdown(
      this.page.locator('input[placeholder="Seleccionar nivel..."]'),
      label,
    );
  }

  async selectInstitucion(label: string): Promise<void> {
    await this.selectFromDropdown(
      this.page.locator('input[placeholder="Seleccionar institución..."]'),
      label,
    );
  }

  async selectEstado(label: string): Promise<void> {
    await this.selectFromDropdown(
      this.page.locator('input[placeholder="Seleccionar estado..."]'),
      label,
    );
  }

  async selectMotivo(label: string): Promise<void> {
    await this.selectFromDropdown(
      this.page.locator('input[placeholder="Seleccionar motivo..."]'),
      label,
    );
  }

  async selectCargo(label: string): Promise<void> {
    await this.selectFromDropdown(
      this.page.locator('input[placeholder="Seleccionar cargo..."]'),
      label,
    );
  }

  // --- Wizard de alta (2 pasos) ---
  async fillPlazaStep(
    nivelLabel: string,
    institucionLabel: string,
    idPuesto?: string,
  ): Promise<void> {
    await this.selectNivel(nivelLabel);
    await this.selectInstitucion(institucionLabel);
    if (idPuesto) {
      await this.idPuestoInput().fill(idPuesto);
    }
  }

  async clickSiguiente(): Promise<void> {
    await this.modal().getByRole('button', { name: 'Siguiente' }).click();
  }

  async fillInstrumentoStep(opts: {
    destinoNuevo: string;
    cargoLabel?: string;
    anio?: string;
    fechaDesde?: string;
    estadoLabel?: string;
    motivoLabel?: string;
  }): Promise<void> {
    await this.selectEstado(opts.estadoLabel ?? 'Autorizado');
    await this.selectMotivo(opts.motivoLabel ?? 'Creación');
    if (opts.cargoLabel) await this.selectCargo(opts.cargoLabel);
    await this.anioInput().fill(opts.anio ?? CURRENT_YEAR);
    await this.fechaDesdeInput().fill(opts.fechaDesde ?? `${CURRENT_YEAR}-01-01`);
    await this.destinoNuevoInput().fill(opts.destinoNuevo);
  }

  async clickCrearProyeccion(): Promise<void> {
    await this.modal().getByRole('button', { name: 'Crear proyección' }).click();
  }

  // --- Búsqueda y filas ---
  async searchFor(term: string): Promise<void> {
    await this.searchInput().fill(term);
    await expect(this.page.getByText('Cargando...')).toHaveCount(0, {
      timeout: 15000,
    });
  }

  async expectRowVisible(term: string): Promise<void> {
    const row = this.rows().filter({ hasText: term });
    await expect(row).toHaveCount(1, { timeout: 15000 });
    await expect(row).toBeVisible();
  }

  async getIdOfRow(term: string): Promise<number> {
    const row = this.rows().filter({ hasText: term });
    const idText = await row.locator('td').first().innerText();
    return Number.parseInt(idText, 10);
  }

  async openEditModalForRow(term: string): Promise<void> {
    const row = this.rows().filter({ hasText: term });
    // Botones de la fila (admin): [0] ojo (detalle), [1] lápiz (editar), [2] papelera
    await row.getByRole('button').nth(1).click();
    await this.expectModalTitle('Editar Proyección');
  }

  // --- Historial (modal de editar) ---
  async expectHistorialSection(): Promise<void> {
    await expect(
      this.modal().getByText('Historial de instrumentos'),
    ).toBeVisible();
  }

  async expectHistorialYear(year: string): Promise<void> {
    const cell = this.modal().locator('.historial-table tr', { hasText: year });
    await expect(cell).toHaveCount(1, { timeout: 15000 });
  }
}