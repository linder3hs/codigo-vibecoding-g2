import { test, expect } from "./fixtures";
import type { Page, APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

// Sufijo único por run
const RUN = String(Date.now()).slice(-6);

// IDs de dependencias compartidas (warehouse + supplier)
let sharedWarehouseId: number;
let sharedSupplierId: number;
let sharedWarehouseName: string;
let sharedSupplierName: string;

async function getToken(req: APIRequestContext): Promise<string> {
  const res = await req.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access } = await res.json();
  return access;
}

function productPayload(tag: string, sku: string) {
  return {
    name: `E2E-PROD-${tag}-${RUN}`,
    sku,
    category: "E2E-Cat",
    supplier: sharedSupplierId,
    warehouse: sharedWarehouseId,
    weight_kg: 1,
    width_cm: 10,
    height_cm: 10,
    depth_cm: 10,
    unit_price: 100,
    stock_quantity: 5,
  };
}

/** Rellena todos los campos obligatorios del formulario de producto. */
async function fillProductForm(
  page: Page,
  opts: {
    name: string;
    sku: string;
    supplierName: string;
    warehouseName: string;
  },
) {
  await page.getByLabel("Nombre").fill(opts.name);
  await page.getByLabel("SKU").fill(opts.sku);
  await page.getByLabel("Categoría").fill("E2E-Cat");

  // Select Proveedor — esperar a que termine de cargar la lista
  await expect(
    page.getByRole("combobox").filter({ hasText: "Seleccionar proveedor" }),
  ).toBeVisible({ timeout: 8_000 });
  await page
    .getByRole("combobox")
    .filter({ hasText: "Seleccionar proveedor" })
    .click();
  await page.getByRole("option", { name: opts.supplierName }).click();

  // Select Almacén
  await page
    .getByRole("combobox")
    .filter({ hasText: "Seleccionar almacén" })
    .click();
  await page.getByRole("option", { name: opts.warehouseName }).click();

  // Campos numéricos (todos > 0 para pasar .positive())
  await page.getByLabel("Precio unitario").fill("500");
  await page.getByLabel("Stock").fill("10");
  await page.getByLabel("Peso (kg)").fill("2");
  await page.getByLabel("Ancho (cm)").fill("20");
  await page.getByLabel("Alto (cm)").fill("15");
  await page.getByLabel("Profundidad (cm)").fill("10");
}

test.describe("Products CRUD", () => {
  // serial: garantiza que beforeAll/afterAll corren una sola vez
  // aunque fullyParallel esté activo globalmente
  test.describe.configure({ mode: "serial" });

  // ── Dependencias compartidas ──────────────────────────────────────────────
  test.beforeAll(async ({ request }) => {
    const token = await getToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    sharedWarehouseName = `E2E-WH-P-${RUN}`;
    const wRes = await request.post(`${API_URL}/warehouses/`, {
      data: {
        name: sharedWarehouseName,
        address: "Test Address",
        city: "Bogotá",
        country: "Colombia",
        capacity_m3: 500,
      },
      headers,
    });
    const w = await wRes.json();
    sharedWarehouseId = w.id;

    sharedSupplierName = `E2E-SUP-P-${RUN}`;
    const sRes = await request.post(`${API_URL}/suppliers/`, {
      data: {
        name: sharedSupplierName,
        tax_id: `E2E${RUN}`,
        contact_name: "Test Contact",
        email: `e2e${RUN}@test.com`,
        phone: "3001234567",
        address: "Calle Test 1",
        city: "Bogotá",
        country: "Colombia",
      },
      headers,
    });
    const s = await sRes.json();
    sharedSupplierId = s.id;
  });

  test.afterAll(async ({ request }) => {
    const token = await getToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    // Los productos ya fueron limpiados en cada test; borrar deps compartidas
    await request.delete(`${API_URL}/suppliers/${sharedSupplierId}/`, {
      headers,
    });
    await request.delete(`${API_URL}/warehouses/${sharedWarehouseId}/`, {
      headers,
    });
  });

  // ── 1. Lista ──────────────────────────────────────────────────────────────
  test("lista: muestra producto sembrado vía API", async ({ page, api }) => {
    const sku = `SKU-L-${RUN}`;
    const p = productPayload("LISTA", sku);
    const id = await api.seed("products", p);

    try {
      await page.goto("/products");
      await expect(page.getByRole("cell", { name: p.name })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("cell", { name: sku })).toBeVisible();
    } finally {
      await api.remove("products", id);
    }
  });

  // ── 2. Crear ──────────────────────────────────────────────────────────────
  test("crear: formulario con selects válidos → aparece en la lista", async ({
    page,
    api,
  }) => {
    const name = `E2E-PROD-CREAR-${RUN}`;
    const sku = `SKU-C-${RUN}`;

    await page.goto("/products");
    await page.getByRole("button", { name: "Nuevo producto" }).click();
    await page.waitForURL("**/products/new**");

    await fillProductForm(page, {
      name,
      sku,
      supplierName: sharedSupplierName,
      warehouseName: sharedWarehouseName,
    });
    await page.getByRole("button", { name: "Crear producto" }).click();

    // onSuccess → router.push("/products")
    await page.waitForURL("**/products**", { timeout: 10_000 });
    await expect(page.getByRole("cell", { name })).toBeVisible({
      timeout: 10_000,
    });

    // Cleanup
    const rows = (await api.list("products", { search: sku })) as Array<{
      id: number;
    }>;
    if (rows.length > 0) await api.remove("products", rows[0].id);
  });

  // ── 3. Validación ─────────────────────────────────────────────────────────
  test("validación: errores Zod con formulario vacío, URL permanece en /products/new", async ({
    page,
  }) => {
    await page.goto("/products/new");

    // Enviar sin rellenar nada
    await page.getByRole("button", { name: "Crear producto" }).click();

    await expect(page.getByText("El nombre es requerido")).toBeVisible();
    await expect(page.getByText("El SKU es requerido")).toBeVisible();
    await expect(page.getByText("Selecciona un proveedor")).toBeVisible();
    await expect(page.getByText("Selecciona un almacén")).toBeVisible();

    // No navega — sigue en la página de creación
    expect(page.url()).toContain("/products/new");
  });

  // ── 4. Editar ─────────────────────────────────────────────────────────────
  test("editar: cambio de nombre se refleja en la tabla", async ({
    page,
    api,
  }) => {
    const sku = `SKU-E-${RUN}`;
    const p = productPayload("EDIT", sku);
    const id = await api.seed("products", p);
    const updatedName = `E2E-PROD-EDIT-UPD-${RUN}`;

    try {
      await page.goto("/products");
      await expect(page.getByRole("cell", { name: p.name })).toBeVisible({
        timeout: 10_000,
      });

      // Primer botón de la fila = Pencil (edit)
      const row = page.getByRole("row").filter({ hasText: p.name });
      await row.getByRole("button").nth(0).click();
      await page.waitForURL(`**/products/${id}/edit**`);

      // Esperar a que el form cargue el producto
      await expect(
        page.getByRole("button", { name: "Guardar cambios" }),
      ).toBeVisible({ timeout: 8_000 });

      // Cambiar nombre
      await page.getByLabel("Nombre").fill(updatedName);
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      // Redirige a lista con nombre actualizado
      await page.waitForURL("**/products**", { timeout: 10_000 });
      await expect(page.getByRole("cell", { name: updatedName })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("cell", { name: p.name })).not.toBeVisible();
    } finally {
      await api.remove("products", id);
    }
  });

  // ── 5. Eliminar ───────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog quita el producto de la lista", async ({
    page,
    api,
  }) => {
    const sku = `SKU-D-${RUN}`;
    const p = productPayload("DEL", sku);
    await api.seed("products", p);

    await page.goto("/products");
    await expect(page.getByRole("cell", { name: p.name })).toBeVisible({
      timeout: 10_000,
    });

    // Segundo botón de la fila = Trash2 (delete)
    const row = page.getByRole("row").filter({ hasText: p.name });
    await row.getByRole("button").nth(1).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("¿Eliminar producto?")).toBeVisible();
    await page.getByRole("button", { name: "Eliminar" }).click();

    // Soft-delete: el producto ya no aparece en la lista
    await expect(page.getByRole("cell", { name: p.name })).not.toBeVisible({
      timeout: 10_000,
    });
  });

  // ── 6. SKU duplicado ──────────────────────────────────────────────────────
  test("SKU duplicado: backend devuelve error en el campo SKU", async ({
    page,
    api,
  }) => {
    const sku = `SKU-DUP-${RUN}`;
    const existing = productPayload("DUP", sku);
    const id = await api.seed("products", existing);

    try {
      await page.goto("/products/new");

      await fillProductForm(page, {
        name: `E2E-PROD-DUP2-${RUN}`,
        sku, // mismo SKU que el ya existente
        supplierName: sharedSupplierName,
        warehouseName: sharedWarehouseName,
      });
      await page.getByRole("button", { name: "Crear producto" }).click();

      // Error del backend mapeado al campo SKU por handleBackendErrors
      await expect(
        page.getByText("product with this sku already exists."),
      ).toBeVisible({ timeout: 8_000 });

      // Sigue en el formulario — no redirigió
      expect(page.url()).toContain("/products/new");
    } finally {
      await api.remove("products", id);
    }
  });

  // ── 7. Búsqueda ───────────────────────────────────────────────────────────
  test("búsqueda: filtra la tabla por nombre correctamente", async ({
    page,
    api,
  }) => {
    const skuAlfa = `SKU-SA-${RUN}`;
    const skuBeta = `SKU-SB-${RUN}`;
    const alfa = productPayload("SRCH-ALFA", skuAlfa);
    const beta = productPayload("SRCH-BETA", skuBeta);
    const idAlfa = await api.seed("products", alfa);
    const idBeta = await api.seed("products", beta);

    try {
      await page.goto("/products");

      // Esperar que ambos aparezcan antes de buscar
      await expect(page.getByRole("cell", { name: alfa.name })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("cell", { name: beta.name })).toBeVisible({
        timeout: 10_000,
      });

      const searchInput = page.getByPlaceholder(
        "Buscar por nombre, SKU, categoría o descripción...",
      );
      await searchInput.fill(alfa.name);

      // Debounce 300ms + respuesta API
      await expect(page.getByRole("cell", { name: alfa.name })).toBeVisible({
        timeout: 8_000,
      });
      await expect(
        page.getByRole("cell", { name: beta.name }),
      ).not.toBeVisible();
    } finally {
      await api.remove("products", idAlfa);
      await api.remove("products", idBeta);
    }
  });
});
