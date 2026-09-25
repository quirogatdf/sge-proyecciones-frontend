import { test } from '@playwright/test';
import { DashboardPage, DASHBOARD_YEAR_SELECTORS } from './dashboard-page';
import { cachedToken } from '../helpers';

test.describe('Dashboard', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await cachedToken(request);
  });

  test(
    'carga con los selectores de año por defecto = año actual y renderiza los paneles',
    { tag: ['@high', '@e2e', '@dashboard', '@DASH-E2E-001'] },
    async ({ page }) => {
      const dash = new DashboardPage(page);
      await dash.authenticate(token);
      await dash.goto();

      for (const selectId of DASHBOARD_YEAR_SELECTORS) {
        await dash.expectYearSelectorDefault(selectId);
      }

      await dash.expectChartCard('Cargos por Año');
      await dash.expectChartCard('Cargos por Nivel');
      await dash.expectChartCard('Horas por Año');
      await dash.expectChartCard('Horas por Nivel');
      await dash.expectChartCard('Proyecciones por Institución');
    },
  );
});