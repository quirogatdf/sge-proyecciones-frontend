import { test, expect } from '@playwright/test';
import { ProyeccionesPage } from './proyecciones-page';
import { API_URL, bearer, cachedToken } from '../helpers';

const CURRENT_YEAR = new Date().getFullYear().toString();

test.describe('Proyecciones — Camino 1 (historial por año)', () => {
  let token: string;
  let refs!: {
    nivelId: number;
    nivelLabel: string;
    institucionId: number;
    institucionLabel: string;
    cargoLabel: string;
  };
  /** IDs de proyecciones creadas durante los tests (para cleanup vía API). */
  let createdIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    token = await cachedToken(request);
    const headers = bearer(token);

    const [nivelRes, institucionRes, cargoRes] = await Promise.all([
      request.get(`${API_URL}/niveles`, { headers }),
      request.get(`${API_URL}/instituciones`, { headers }),
      request.get(`${API_URL}/cargos`, { headers }),
    ]);

    const niveles = (await nivelRes.json()).data as { id: number; nombre: string }[];
    const instituciones = (await institucionRes.json()).data as {
      id: number;
      nombre: string;
    }[];
    const cargos = (await cargoRes.json()).data as {
      id: number;
      codigo: string;
      nombre: string;
    }[];

    refs = {
      nivelId: niveles[0].id,
      nivelLabel: niveles[0].nombre,
      institucionId: instituciones[0].id,
      institucionLabel: instituciones[0].nombre,
      cargoLabel: `${cargos[0].codigo} - ${cargos[0].nombre}`,
    };
  });

  test.afterEach(async ({ request }) => {
    const t = await cachedToken(request);
    for (const id of createdIds) {
      await request.delete(`${API_URL}/proyecciones/${id}`, {
        headers: bearer(t),
      });
    }
    createdIds = [];
  });

  test(
    'la lista carga con año por defecto = año actual y el modal de alta usa títulos correctos',
    { tag: ['@critical', '@e2e', '@proyecciones', '@PROY-E2E-001'] },
    async ({ page }) => {
      const list = new ProyeccionesPage(page);
      await list.authenticate(token);
      await list.goto();
      await list.expectReady();
      await list.expectYearFilterDefault();

      // Botón etiquetado según configuración (antes decía "Nuevo")
      await expect(list.createButton()).toBeVisible();

      // Abrir alta: título "Nueva Proyección" y wizard arranca en paso 1 (Plaza)
      await list.openCreateModal();
      await list.expectStepActive('Plaza');
      await list.cancelButton().click();
      await list.expectModalClosed();
    },
  );

  test(
    'alta en dos pasos: plaza → instrumento del año, se crea y aparece en la lista',
    { tag: ['@critical', '@e2e', '@proyecciones', '@PROY-E2E-002'] },
    async ({ page }) => {
      const list = new ProyeccionesPage(page);
      await list.authenticate(token);
      await list.goto();
      await list.expectReady();

      const idPuesto = `E2E-${Date.now()}`;
      await list.openCreateModal();

      // PASO 1: plaza
      await list.fillPlazaStep(refs.nivelLabel, refs.institucionLabel, idPuesto);
      await list.clickSiguiente();

      // PASO 2: instrumento del año
      await list.expectStepActive('Instrumento del año');
      await list.expectSaveButton('Crear proyección');
      await list.fillInstrumentoStep({
        destinoNuevo: `Destino E2E ${Date.now()}`,
        cargoLabel: refs.cargoLabel,
      });
      await list.clickCrearProyeccion();

      await list.expectModalClosed();

      // Debe aparecer al buscar por id_puesto (default año actual = 2026)
      await list.searchFor(idPuesto);
      await list.expectRowVisible(idPuesto);

      const createdId = await list.getIdOfRow(idPuesto);
      createdIds.push(createdId);
    },
  );

  test(
    'el modal de editar se titula "Editar Proyección" y muestra el historial de instrumentos',
    { tag: ['@high', '@e2e', '@proyecciones', '@PROY-E2E-003'] },
    async ({ page }) => {
      // Fixture vía API: plaza + instrumento del año actual
      const idPuesto = `E2E-FIX-${Date.now()}`;
      const created = await page.request.post(`${API_URL}/proyecciones`, {
        headers: bearer(token),
        data: {
          id_nivel: refs.nivelId,
          id_institucion: refs.institucionId,
          id_puesto: idPuesto,
          instrumento: {
            anio: CURRENT_YEAR,
            estado: 'Autorizado',
            motivo: 'Creación',
            fecha_desde: `${CURRENT_YEAR}-01-01`,
            destino_nuevo: `Destino E2E fix ${Date.now()}`,
          },
        },
      });
      const body = (await created.json()) as { data: { id: number } };
      createdIds.push(body.data.id);

      const list = new ProyeccionesPage(page);
      await list.authenticate(token);
      await list.goto();
      await list.searchFor(idPuesto);
      await list.openEditModalForRow(idPuesto);

      await list.expectModalTitle('Editar Proyección');
      await list.expectHistorialSection();
      await list.expectHistorialYear(CURRENT_YEAR);
    },
  );
});