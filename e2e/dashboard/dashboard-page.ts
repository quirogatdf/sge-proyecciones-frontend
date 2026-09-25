import { Page, expect } from '@playwright/test';

export const DASHBOARD_YEAR_SELECTORS = [
  'cargos-nivel-anio-select',
  'horas-nivel-anio-select',
  'stats-anio-select',
] as const;

const CURRENT_YEAR = new Date().getFullYear().toString();

export class DashboardPage {
  constructor(public readonly page: Page) {}

  /** Inyecta el token de Sanctum ANTES de que Angular bootstrapee. */
  async authenticate(token: string): Promise<void> {
    await this.page.addInitScript((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(
      this.page.getByRole('heading', { name: 'Mi escritorio' }),
    ).toBeVisible({ timeout: 20000 });
  }

  async expectYearSelectorDefault(selectId: string): Promise<void> {
    await expect(this.page.locator(`#${selectId}`)).toHaveValue(CURRENT_YEAR);
  }

  async expectChartCard(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }
}