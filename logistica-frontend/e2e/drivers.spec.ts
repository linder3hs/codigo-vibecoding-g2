import { test, expect } from "./fixtures";
import type { Page, APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

const RUN = String(Date.now()).slice(-6);

// ── Shared state (set in beforeAll) ─────────────────────────────────────────
let sharedTransportId: number;
let sharedTransportLabel: string; // "PLATE — Brand Model"

// User A → shared driver (lista / editar / eliminar)
let sharedUserId: number;
let sharedUserFullName: string;
let sharedUserEmail: string;
let sharedUserUsername: string;
let sharedDriverId: number;

// User B → crear test (types the ID manually in form)
let crearUserId: number;
let crearUserFullName: string;

// Users C + D → búsqueda test
let srchUser1Id: number;
let srchUser1FullName: string;
let srchUser2Id: number;
let srchUser2FullName: string;

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getToken(req: APIRequestContext): Promise<string> {
  const res = await req.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access } = await res.json();
  return access;
}

/**
 * Abre el DatePicker (clic en el trigger "Seleccionar fecha") y elige el día
 * 15 en la vista de mes actual. react-day-picker v10 renders días en gridcells.
 */
async function pickCalendarDate(page: Page) {
  // Esperar a que el calendario aparezca con los días
  await expect(
    page.getByRole("gridcell").filter({ hasText: /^15$/ }).first()
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("gridcell").filter({ hasText: /^15$/ }).first().click();
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Drivers CRUD", () => {
  // serial: beforeAll/afterAll corren una sola vez con fullyParallel activo
  test.describe.configure({ mode: "serial" });

  // ── Seed compartido ────────────────────────────────────────────────────────
  test.beforeAll(async ({ request }) => {
    const token = await getToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Transport compartido (sin soft-delete → hard-delete en afterAll)
    const tRes = await request.post(`${API_URL}/transport/`, {
      data: {
        plate_number: `E2E-${RUN}`,
        transport_type: "VAN",
        brand: "TestBrand",
        model: "TestModel",
        year: 2022,
        capacity_kg: "1000.00",
        capacity_m3: "10.00",
        is_available: true,
      },
      headers,
    });
    const t = await tRes.json();
    sharedTransportId = t.id;
    sharedTransportLabel = `${t.plate_number} — ${t.brand} ${t.model}`;

    // 2. Crear usuarios (Driver.user = OneToOneField → un driver por user)
    //    Los usuarios no se pueden borrar si existen rows de driver (PROTECT).
    //    Se aceptan como acumulación en el test DB; el sufijo RUN previene colisiones.
    const makeUser = async (suffix: string) => {
      const res = await request.post(`${API_URL}/admin/users/`, {
        data: {
          username: `e2edrv${suffix}${RUN}`,
          email: `e2edrv${suffix}${RUN}@test.com`,
          password: "testpass123",
          first_name: "E2E",
          last_name: `Drv${suffix}${RUN}`,
          is_active: true,
          is_superuser: false,
          is_staff: false,
        },
        headers,
      });
      if (!res.ok()) {
        throw new Error(`makeUser(${suffix}) falló (${res.status()}): ${await res.text()}`);
      }
      return await res.json();
    };

    const uA = await makeUser("A");
    sharedUserId = uA.id;
    sharedUserFullName = `E2E DrvA${RUN}`;
    sharedUserEmail = uA.email;
    sharedUserUsername = uA.username;

    const uB = await makeUser("B");
    crearUserId = uB.id;
    crearUserFullName = `E2E DrvB${RUN}`;

    const uC = await makeUser("C");
    srchUser1Id = uC.id;
    srchUser1FullName = `E2E DrvC${RUN}`;

    const uD = await makeUser("D");
    srchUser2Id = uD.id;
    srchUser2FullName = `E2E DrvD${RUN}`;

    // 3. Seed shared driver (lista / editar / eliminar tests lo usan en orden serial)
    const dRes = await request.post(`${API_URL}/drivers/`, {
      data: {
        user: sharedUserId,
        license_number: `LIC-A-${RUN}`,
        license_expiry: "2027-12-31",
        phone: "3001234567",
        transport: sharedTransportId,
        is_active: true,
      },
      headers,
    });
    if (!dRes.ok()) {
      throw new Error(`seed driver falló (${dRes.status()}): ${await dRes.text()}`);
    }
    const d = await dRes.json();
    sharedDriverId = d.id;
  });

  test.afterAll(async ({ request }) => {
    const token = await getToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    // Hard-delete transport (SET_NULL en driver.transport — no viola FK)
    await request.delete(`${API_URL}/transport/${sharedTransportId}/`, { headers });

    // Intentar borrar usuarios (falla silenciosamente si hay rows de driver con PROTECT)
    for (const id of [sharedUserId, crearUserId, srchUser1Id, srchUser2Id]) {
      if (id) {
        await request.delete(`${API_URL}/admin/users/${id}/`, { headers });
      }
    }
  });

  // ── 1. Lista ──────────────────────────────────────────────────────────────
  test("lista: muestra user_full_name, user_email y license del conductor sembrado", async ({
    page,
  }) => {
    await page.goto("/drivers");

    await expect(
      page.getByRole("cell", { name: sharedUserFullName })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole("cell", { name: sharedUserEmail })
    ).toBeVisible();

    await expect(
      page.getByRole("cell", { name: `LIC-A-${RUN}` })
    ).toBeVisible();
  });

  // ── 2. Crear ──────────────────────────────────────────────────────────────
  test("crear: formulario con user_id + transport select → aparece en lista", async ({
    page,
    api,
  }) => {
    await page.goto("/drivers");
    await page.getByRole("button", { name: "Nuevo conductor" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nuevo conductor" })
    ).toBeVisible();

    // User ID (campo numérico en creación)
    await page.getByLabel("ID de usuario").fill(String(crearUserId));

    // Número de licencia
    await page.getByLabel("Número de licencia").fill(`LIC-B-${RUN}`);

    // Fecha de vencimiento via DatePicker
    await page.getByRole("button", { name: "Seleccionar fecha" }).click();
    await pickCalendarDate(page);

    // Teléfono
    await page.getByLabel("Teléfono").fill("3109876543");

    // Transport select — esperar a que cargue la lista
    await expect(
      page.getByRole("combobox").filter({ hasText: "Sin asignar" })
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole("combobox").filter({ hasText: "Sin asignar" }).click();
    await page.getByRole("option", { name: sharedTransportLabel }).click();

    await page.getByRole("button", { name: "Crear conductor" }).click();

    // Dialog cierra y conductor aparece en tabla
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole("cell", { name: crearUserFullName })
    ).toBeVisible({ timeout: 10_000 });

    // Cleanup vía API (soft-delete)
    const rows = (await api.list("drivers", {
      search: `LIC-B-${RUN}`,
    })) as Array<{ id: number }>;
    if (rows.length > 0) await api.remove("drivers", rows[0].id);
  });

  // ── 3. Validación ─────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, dialog permanece abierto", async ({
    page,
  }) => {
    await page.goto("/drivers");
    await page.getByRole("button", { name: "Nuevo conductor" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Limpiar el campo user (default 0 → NaN dispara "El ID del usuario es requerido";
    // con 0 el error sería "Too small: expected number to be >0")
    await page.getByLabel("ID de usuario").clear();

    await page.getByRole("button", { name: "Crear conductor" }).click();

    await expect(page.getByText("El ID del usuario es requerido")).toBeVisible();
    await expect(page.getByText("El número de licencia es requerido")).toBeVisible();
    await expect(page.getByText("La fecha de vencimiento es requerida")).toBeVisible();
    await expect(page.getByText("El teléfono es requerido")).toBeVisible();

    // El dialog no cierra — no se creó nada
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  // ── 4. Editar ─────────────────────────────────────────────────────────────
  test("editar: muestra user_username en form y cambio de licencia se refleja en tabla", async ({
    page,
  }) => {
    await page.goto("/drivers");
    await expect(
      page.getByRole("cell", { name: sharedUserFullName })
    ).toBeVisible({ timeout: 10_000 });

    // Primer botón de la fila = Pencil (edit)
    const row = page.getByRole("row").filter({ hasText: sharedUserFullName });
    await row.getByRole("button").nth(0).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Editar conductor" })
    ).toBeVisible();

    // Verificar que user_username se muestra en el campo readonly de usuario
    await expect(
      page.getByText(`${sharedUserFullName} (${sharedUserUsername})`)
    ).toBeVisible();

    // Verificar que el transport select ya tiene el transport asignado
    await expect(
      page.getByRole("combobox").filter({ hasText: sharedTransportLabel })
    ).toBeVisible({ timeout: 8_000 });

    // Cambiar número de licencia
    const updatedLicense = `LIC-A-UPD-${RUN}`;
    await page.getByLabel("Número de licencia").fill(updatedLicense);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    // Dialog cierra; licencia actualizada en tabla
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole("cell", { name: updatedLicense })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("cell", { name: sharedUserFullName })
    ).toBeVisible(); // user_full_name no cambia
  });

  // ── 5. Eliminar (Desactivar) ───────────────────────────────────────────────
  test("eliminar: AlertDialog desactiva el conductor y lo quita de la lista activa", async ({
    page,
  }) => {
    await page.goto("/drivers");
    await expect(
      page.getByRole("cell", { name: sharedUserFullName })
    ).toBeVisible({ timeout: 10_000 });

    // Segundo botón de la fila = Trash2 (delete)
    const row = page.getByRole("row").filter({ hasText: sharedUserFullName });
    await row.getByRole("button").nth(1).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("¿Desactivar conductor?")).toBeVisible();
    await page.getByRole("button", { name: "Desactivar" }).click();

    // Soft-delete (is_active=False): ya no aparece en la lista activa
    await expect(
      page.getByRole("cell", { name: sharedUserFullName })
    ).not.toBeVisible({ timeout: 10_000 });
  });

  // ── 6. Búsqueda ───────────────────────────────────────────────────────────
  test("búsqueda: filtra conductores por número de licencia", async ({
    page,
    api,
  }) => {
    const lic1 = `LIC-C-${RUN}`;
    const lic2 = `LIC-D-${RUN}`;

    const id1 = await api.seed("drivers", {
      user: srchUser1Id,
      license_number: lic1,
      license_expiry: "2027-12-31",
      phone: "3001111111",
      transport: null,
      is_active: true,
    });
    const id2 = await api.seed("drivers", {
      user: srchUser2Id,
      license_number: lic2,
      license_expiry: "2027-12-31",
      phone: "3002222222",
      transport: null,
      is_active: true,
    });

    try {
      await page.goto("/drivers");

      // Ambos conductores visibles antes de filtrar
      await expect(
        page.getByRole("cell", { name: srchUser1FullName })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("cell", { name: srchUser2FullName })
      ).toBeVisible({ timeout: 10_000 });

      // Buscar por licencia del conductor 1 (FiltersSheet en desktop = Card inline)
      const searchInput = page.getByPlaceholder(
        "Buscar por nombre, licencia, teléfono, email..."
      );
      await searchInput.fill(lic1);

      // Solo conductor 1 visible tras debounce 300ms + respuesta API
      await expect(
        page.getByRole("cell", { name: srchUser1FullName })
      ).toBeVisible({ timeout: 8_000 });
      await expect(
        page.getByRole("cell", { name: srchUser2FullName })
      ).not.toBeVisible();
    } finally {
      await api.remove("drivers", id1);
      await api.remove("drivers", id2);
    }
  });
});
