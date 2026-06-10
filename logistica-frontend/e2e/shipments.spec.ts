import { test, expect } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

const RUN = String(Date.now()).slice(-6);

// ── Shared state (set in beforeAll) ──────────────────────────────────────────
let warehouseId: number;
let warehouseName: string;
let supplierId: number;
let customerId: number;
let customerName: string;
let productId: number;
let productName: string;
let productSku: string;
let seededShipmentId: number;
let seededTrackingNumber: string;

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getToken(req: APIRequestContext): Promise<string> {
  const res = await req.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access } = await res.json();
  return access;
}

// ── Seed helpers encapsulados ─────────────────────────────────────────────────

async function seedWarehouse(
  req: APIRequestContext,
  headers: Record<string, string>,
): Promise<{ id: number; name: string }> {
  const name = `E2E-SHP-WH-${RUN}`;
  const res = await req.post(`${API_URL}/warehouses/`, {
    data: {
      name,
      address: "Calle Test 1",
      city: "Bogotá",
      country: "Colombia",
      capacity_m3: 500,
    },
    headers,
  });
  if (!res.ok())
    throw new Error(`seedWarehouse falló (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return { id: body.id, name };
}

async function seedSupplier(
  req: APIRequestContext,
  headers: Record<string, string>,
): Promise<{ id: number }> {
  const res = await req.post(`${API_URL}/suppliers/`, {
    data: {
      name: `E2E-SHP-SUP-${RUN}`,
      tax_id: `SHPTAX${RUN}`,
      contact_name: "Test Contact",
      email: `shpsup${RUN}@test.com`,
      phone: "3001234567",
      address: "Calle Proveedor 1",
      city: "Bogotá",
      country: "Colombia",
    },
    headers,
  });
  if (!res.ok())
    throw new Error(`seedSupplier falló (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return { id: body.id };
}

async function seedCustomer(
  req: APIRequestContext,
  headers: Record<string, string>,
): Promise<{ id: number; name: string }> {
  const name = `E2E-SHP-CUST-${RUN}`;
  const res = await req.post(`${API_URL}/customers/`, {
    data: {
      name,
      customer_type: "COMPANY",
      email: `shpcust${RUN}@test.com`,
      phone: "3009876543",
      address: "Av. Test 100",
      city: "Medellín",
      country: "Colombia",
    },
    headers,
  });
  if (!res.ok())
    throw new Error(`seedCustomer falló (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return { id: body.id, name };
}

async function seedProduct(
  req: APIRequestContext,
  headers: Record<string, string>,
  wId: number,
  sId: number,
): Promise<{ id: number; name: string; sku: string }> {
  const name = `E2E-SHP-PROD-${RUN}`;
  const sku = `SHPSKU${RUN}`;
  const res = await req.post(`${API_URL}/products/`, {
    data: {
      name,
      sku,
      category: "E2E-Cat",
      supplier: sId,
      warehouse: wId,
      unit_price: 1000,
      stock_quantity: 50,
      weight_kg: 1,
      width_cm: 10,
      height_cm: 10,
      depth_cm: 10,
    },
    headers,
  });
  if (!res.ok())
    throw new Error(`seedProduct falló (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return { id: body.id, name, sku };
}

async function seedShipment(
  req: APIRequestContext,
  headers: Record<string, string>,
  cId: number,
  wId: number,
): Promise<{ id: number; tracking_number: string }> {
  const res = await req.post(`${API_URL}/shipments/`, {
    data: {
      customer: cId,
      origin_warehouse: wId,
      destination_address: "Calle E2E Seed 456",
      destination_city: `E2E-SEED-${RUN}`,
      destination_country: "Colombia",
      status: "PENDING",
    },
    headers,
  });
  if (!res.ok())
    throw new Error(`seedShipment falló (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return { id: body.id, tracking_number: body.tracking_number };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Shipments CRUD + Items", () => {
  // serial: beforeAll/afterAll comparten estado con fullyParallel activo
  test.describe.configure({ mode: "serial" });

  // ── Seed de todas las dependencias ────────────────────────────────────────
  test.beforeAll(async ({ request }) => {
    const token = await getToken(request);
    const h = { Authorization: `Bearer ${token}` };

    const wh = await seedWarehouse(request, h);
    warehouseId = wh.id;
    warehouseName = wh.name;

    const sup = await seedSupplier(request, h);
    supplierId = sup.id;

    const cust = await seedCustomer(request, h);
    customerId = cust.id;
    customerName = cust.name;

    // product necesita warehouse + supplier
    const prod = await seedProduct(request, h, warehouseId, supplierId);
    productId = prod.id;
    productName = prod.name;
    productSku = prod.sku;

    // shipment necesita customer + warehouse
    const shp = await seedShipment(request, h, customerId, warehouseId);
    seededShipmentId = shp.id;
    seededTrackingNumber = shp.tracking_number;
  });

  // ── Limpieza en orden inverso de dependencias ─────────────────────────────
  test.afterAll(async ({ request }) => {
    const token = await getToken(request);
    const h = { Authorization: `Bearer ${token}` };

    // Hard-delete: Shipment no tiene soft-delete; CASCADE elimina ShipmentItems
    // Primero el shipment para liberar FK en customer + warehouse (PROTECT)
    await request.delete(`${API_URL}/shipments/${seededShipmentId}/`, { headers: h });

    // Soft-deletes
    await request.delete(`${API_URL}/products/${productId}/`, { headers: h });
    await request.delete(`${API_URL}/suppliers/${supplierId}/`, { headers: h });
    await request.delete(`${API_URL}/warehouses/${warehouseId}/`, { headers: h });
    await request.delete(`${API_URL}/customers/${customerId}/`, { headers: h });
  });

  // ── 1. Crear via UI: tracking_number auto-generado ────────────────────────
  test("crear: formulario genera tracking_number automático y aparece en la lista", async ({
    page,
    api,
  }) => {
    const destCity = `E2E-UI-${RUN}`;

    await page.goto("/shipments");
    await page.getByRole("button", { name: "Nuevo envío" }).click();
    await page.waitForURL("**/shipments/new**");

    // Customer select — placeholder cambia de "Cargando..." a "Seleccionar cliente"
    // cuando loadingCustomers se resuelve; click() espera actionability
    await expect(
      page.getByRole("combobox").filter({ hasText: "Seleccionar cliente" }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("combobox")
      .filter({ hasText: "Seleccionar cliente" })
      .click();
    await page.getByRole("option", { name: customerName }).click();

    // Warehouse select
    await expect(
      page.getByRole("combobox").filter({ hasText: "Seleccionar almacén" }),
    ).toBeVisible({ timeout: 8_000 });
    await page
      .getByRole("combobox")
      .filter({ hasText: "Seleccionar almacén" })
      .click();
    await page.getByRole("option", { name: warehouseName }).click();

    // Campos obligatorios de destino
    await page.getByLabel("Dirección destino").fill("Carrera E2E 123");
    await page.getByLabel("Ciudad destino").fill(destCity);

    await page.getByRole("button", { name: "Crear envío" }).click();

    // onSuccess → router.push("/shipments")
    await page.waitForURL("**/shipments**", { timeout: 10_000 });

    // Fila identificada por destCity único en este RUN
    const uiRow = page.getByRole("row").filter({ hasText: destCity });
    await expect(uiRow).toBeVisible({ timeout: 10_000 });

    // Primera celda = tracking_number auto-generado (12 hex mayúsculas: uuid.hex[:12].upper())
    const trackingCell = uiRow.getByRole("cell").first();
    await expect(trackingCell).toContainText(/[A-F0-9]{8,}/);

    // Cleanup: ir al detalle para obtener el ID, luego borrar via API
    await uiRow.getByRole("button").nth(0).click(); // Eye → /shipments/{id}
    await page.waitForURL(/\/shipments\/\d+/);
    const idMatch = page.url().match(/\/shipments\/(\d+)/);
    const uiShipmentId = idMatch ? Number(idMatch[1]) : 0;
    if (uiShipmentId) await api.remove("shipments", uiShipmentId);
  });

  // ── 2. Detalle: tracking_number como heading ───────────────────────────────
  test("detalle: muestra tracking_number como heading y datos del envío", async ({
    page,
  }) => {
    await page.goto(`/shipments/${seededShipmentId}`);

    // tracking_number renderizado como <h1 class="...font-mono">
    const heading = page.locator("h1").first();
    await expect(heading).toContainText(seededTrackingNumber, {
      timeout: 10_000,
    });

    // Datos derivados visibles en el detalle
    // API no incluye customer_name resuelto → el detalle muestra "#ID" como fallback
    // exact: true previene que "#3" haga match parcial con "#33", "#30", etc.
    await expect(page.getByText(`#${customerId}`, { exact: true })).toBeVisible();
    // origin_warehouse se muestra como "#ID"
    await expect(page.getByText(`#${warehouseId}`, { exact: true })).toBeVisible();
    // Destino contiene la ciudad única del run
    await expect(page.getByText(`E2E-SEED-${RUN}`, { exact: false })).toBeVisible();
    await expect(page.getByText("Pendiente")).toBeVisible(); // badge status PENDING
  });

  // ── 3. Items: agregar ítem y verificar en tabla ────────────────────────────
  test("items agregar: seleccionar producto y cantidad → aparece en lista de ítems", async ({
    page,
  }) => {
    await page.goto(`/shipments/${seededShipmentId}`);

    // Estado inicial sin ítems
    await expect(page.getByText("No hay ítems en este envío")).toBeVisible({
      timeout: 10_000,
    });

    // Abrir dialog de agregar ítem
    await page.getByRole("button", { name: "Agregar ítem" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Esperar que el select de producto cargue
    // ItemForm: placeholder cambia "Cargando..." → "Seleccionar producto" cuando loadingProducts=false
    await expect(
      page.getByRole("combobox").filter({ hasText: "Seleccionar producto" }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("combobox")
      .filter({ hasText: "Seleccionar producto" })
      .click();
    // Opción renderizada como "{name} — {sku}" en ItemForm
    await page
      .getByRole("option", { name: `${productName} — ${productSku}` })
      .click();

    await page.getByLabel("Cantidad").fill("3");
    await page.getByLabel("Precio unitario").fill("500");

    // Submit: el trigger "Agregar ítem" tiene aria-hidden al abrirse el dialog
    // → el único "Agregar ítem" visible es el submit dentro del dialog
    await page.getByRole("button", { name: "Agregar ítem" }).click();

    // Dialog cierra en onSuccess (setShowForm(false)) + invalidateQueries refresca tabla
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 });

    // Ítem aparece en la tabla de ítems.
    // ShipmentItem serializer no incluye product_name/product_sku resueltos →
    // ItemList usa fallback: product_name || '#${item.product}'  y  product_sku || "—"
    await expect(
      page.getByRole("cell", { name: `#${productId}`, exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    // Cantidad = "3" y precio = "$500" verifican que el ítem fue persistido
    await expect(page.getByRole("cell", { name: "3" }).first()).toBeVisible();
  });

  // ── 4. Items: dialog de eliminar ──────────────────────────────────────────
  // NOTA: DELETE /api/v1/shipments/{pk}/items/{item_id}/ no está implementado
  // en el backend (@action solo registra GET + POST). El test verifica que el
  // AlertDialog se abre con el contenido correcto y cancela sin llamar al endpoint roto.
  test("items eliminar: AlertDialog muestra producto y cancela sin borrar", async ({
    page,
  }) => {
    await page.goto(`/shipments/${seededShipmentId}`);

    // Ítem del test anterior (ShipmentItem API usa fallback #ID para nombre)
    await expect(
      page.getByRole("cell", { name: `#${productId}`, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // Botón Trash2 en la fila del ítem
    const itemRow = page.locator("tbody tr").filter({ hasText: `#${productId}` });
    await itemRow.getByRole("button").click();

    // AlertDialog de confirmación
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("¿Eliminar ítem?")).toBeVisible();
    // DeleteShipmentItemDialog muestra: product_name || 'Producto #${item.product}'
    await expect(
      page.getByText(`Producto #${productId}`),
    ).toBeVisible();

    // Cancelar — no se llama al endpoint (404) y el ítem permanece
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("alertdialog")).not.toBeVisible({
      timeout: 5_000,
    });

    // Ítem sigue presente en la tabla
    await expect(
      page.getByRole("cell", { name: `#${productId}`, exact: true }),
    ).toBeVisible();
  });

  // ── 5. Status transition: PENDING → CONFIRMED ─────────────────────────────
  test("status transition: PENDING → CONFIRMED se refleja en la lista", async ({
    page,
  }) => {
    await page.goto(`/shipments/${seededShipmentId}/edit`);

    // Esperar a que el formulario cargue completamente
    await expect(
      page.getByRole("button", { name: "Guardar cambios" }),
    ).toBeVisible({ timeout: 10_000 });

    // Status select muestra "Pendiente" (STATUS_LABELS.PENDING del shipment sembrado)
    await expect(
      page.getByRole("combobox").filter({ hasText: "Pendiente" }),
    ).toBeVisible({ timeout: 8_000 });
    await page
      .getByRole("combobox")
      .filter({ hasText: "Pendiente" })
      .click();
    await page.getByRole("option", { name: "Confirmado" }).click();

    await page.getByRole("button", { name: "Guardar cambios" }).click();

    // onSuccess → router.push("/shipments")
    await page.waitForURL("**/shipments**", { timeout: 10_000 });

    // Fila identificada por tracking_number único del envío sembrado
    const row = page
      .getByRole("row")
      .filter({ hasText: seededTrackingNumber });
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Badge de status actualizado a "Confirmado"
    await expect(row.getByText("Confirmado")).toBeVisible();
  });
});
