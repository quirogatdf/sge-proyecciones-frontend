# E2E Tests: Proyecciones (Camino 1)

**Suite ID:** `PROYECTOR`
**Feature:** Historial por año — proyecciones (plaza) + proyeccion_instrumentos (snapshot por año)

---

## Test Case: `PROY-E2E-001` — Lista con año por defecto y modal de alta

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @proyecciones

**Description/Objective:** La lista carga con el selector de año apuntando al año calendario actual y los títulos del modal de alta son "Nueva Proyección".

**Preconditions:**
- Backend corriendo en :8000, frontend en :4200.
- Usuario admin (@sge.gob.ar / admin123) y data del año actual.

### Flow Steps:
1. Autenticar (token vía API inyectado en localStorage).
2. Navegar a /proyecciones.
3. Verificar selector de año = año actual (default).
4. Click "Nueva Proyección".
5. Verificar título "Nueva Proyección" y stepper activo en "Plaza".
6. Cancelar.

### Expected Result:
- Año por defecto = año calendario actual.
- Título correcto y wizard arranca en paso 1.

### Key verification points:
- `expectYearFilterDefault()`
- `expectModalTitle('Nueva Proyección')`

---

## Test Case: `PROY-E2E-002` — Alta en dos pasos

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @proyecciones

**Description/Objective:** El wizard crea una plaza (paso 1) y su instrumento del año (paso 2) de forma atómica; la fila aparece en la lista.

**Preconditions:**
- Referencias de nivel/institución/cargo obtenidas por API.

### Flow Steps:
1. Abrir modal de alta.
2. Paso 1: seleccionar nivel + institución, click "Siguiente".
3. Paso 2: estado, motivo, cargo, año (actual), fecha desde, destino nuevo.
4. Click "Crear proyección".
5. Buscar por id_puesto único y verificar la fila.
6. Cleanup: DELETE por API.

### Expected Result:
- Modal se cierra, fila visible al buscar, id capturado para cleanup.

---

## Test Case: `PROY-E2E-003` — Modal de editar con historial

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @proyecciones

**Description/Objective:** El modal de editar se titula "Editar Proyección" y muestra la sección "Historial de instrumentos" con una fila por año.

**Preconditions:**
- Fixture creado por API (plaza + instrumento del año actual).

### Flow Steps:
1. Buscar el fixture por id_puesto.
2. Click en el botón editar (lápiz) de la fila.
3. Verificar título "Editar Proyección".
4. Verificar sección "Historial de instrumentos" y fila del año.

### Expected Result:
- Título correcto y fila del año actual en el historial.

---

## Test Case: `DASH-E2E-001` — Dashboard con año por defecto

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** El dashboard carga con los tres selectores de año en el año actual y renderiza los paneles.

### Flow Steps:
1. Autenticar y navegar a /dashboard.
2. Verificar selectores `cargos-nivel-anio-select`, `horas-nivel-anio-select`, `stats-anio-select` = año actual.
3. Verificar títulos de los 5 paneles.

### Expected Result:
- Selectores default = año actual; paneles visibles.