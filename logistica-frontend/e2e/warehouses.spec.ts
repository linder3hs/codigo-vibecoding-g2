import { test, expect } from "./fixtures";

// Sufijo único por ejecución — evita colisiones entre runs paralelos
const RUN = String(Date.now()).slice(-6);

function payload(tag: string) {
  return {
    name: `E2E-${tag}-${RUN}`,
    address: `Calle Test 123`,
    city: "Bogotá",
    country: "Colombia",
    capacity_m3: 1500,
  };
}

test.describe("Warehouses CRUD", () => {
  // storageState inyectado por el proyecto chromium (playwright/.auth/user.json)

  // ── 1. Lista ──────────────────────────────────────────────────────────────
  test("lista: carga y muestra registro sembrado vía API", async ({
    page,
    api,
  }) => {
    const p = payload("LISTA");
    const id = await api.seed("warehouses", p);

    try {
      await page.goto("/warehouses");
      await expect(
        page.getByRole("cell", { name: p.name })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove("warehouses", id);
    }
  });

  // ── 2. Crear ──────────────────────────────────────────────────────────────
  test("crear: formulario válido → registro aparece en la lista", async ({
    page,
    api,
  }) => {
    const name = `E2E-CREAR-${RUN}`;

    await page.goto("/warehouses");

    // Abrir modal — espera implícita a que canAdd resuelva y muestre el botón
    await page.getByRole("button", { name: "Nuevo almacén" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nuevo almacén" })
    ).toBeVisible();

    // Rellenar formulario
    await page.getByLabel("Nombre del almacén").fill(name);
    await page.getByLabel("Dirección").fill("Av. Test 456");
    await page.getByLabel("Ciudad").fill("Medellín");
    await page.getByLabel("País").fill("Colombia");
    await page.getByLabel("Capacidad (m³)").fill("2500");

    // Enviar
    await page.getByRole("button", { name: "Crear almacén" }).click();

    // Dialog cierra y nombre aparece en tabla
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole("cell", { name })
    ).toBeVisible({ timeout: 10_000 });

    // Cleanup: buscar el id recién creado y eliminarlo
    const rows = (await api.list("warehouses", { search: name })) as Array<{
      id: number;
    }>;
    if (rows.length > 0) await api.remove("warehouses", rows[0].id);
  });

  // ── 3. Validación ─────────────────────────────────────────────────────────
  test("validación: formulario vacío muestra errores Zod, no crea nada", async ({
    page,
  }) => {
    await page.goto("/warehouses");

    await page.getByRole("button", { name: "Nuevo almacén" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Enviar sin rellenar ningún campo
    await page.getByRole("button", { name: "Crear almacén" }).click();

    // Mensajes Zod visibles (country tiene default "Colombia" → no falla)
    await expect(page.getByText("El nombre es requerido")).toBeVisible();
    await expect(page.getByText("La dirección es requerida")).toBeVisible();
    await expect(page.getByText("La ciudad es requerida")).toBeVisible();
    await expect(page.getByText("Debe ser un número")).toBeVisible(); // capacity vacía → NaN

    // El dialog permanece abierto (no se creó nada)
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  // ── 4. Editar ─────────────────────────────────────────────────────────────
  test("editar: cambio de nombre se refleja en la tabla", async ({
    page,
    api,
  }) => {
    const original = payload("EDIT");
    const updatedName = `E2E-EDIT-UPD-${RUN}`;
    const id = await api.seed("warehouses", original);

    try {
      await page.goto("/warehouses");
      await expect(
        page.getByRole("cell", { name: original.name })
      ).toBeVisible({ timeout: 10_000 });

      // Abrir edición — primer botón de la fila (Pencil)
      const row = page.getByRole("row").filter({ hasText: original.name });
      await row.getByRole("button").nth(0).click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Editar almacén" })
      ).toBeVisible();

      // Cambiar nombre
      const nameInput = page.getByLabel("Nombre del almacén");
      await nameInput.fill(updatedName);

      await page.getByRole("button", { name: "Guardar cambios" }).click();

      // Dialog cierra; nombre actualizado visible; original ya no está
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 8_000,
      });
      await expect(
        page.getByRole("cell", { name: updatedName })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("cell", { name: original.name })
      ).not.toBeVisible();
    } finally {
      await api.remove("warehouses", id);
    }
  });

  // ── 5. Eliminar ───────────────────────────────────────────────────────────
  test("eliminar: confirmar AlertDialog quita el registro de la lista", async ({
    page,
    api,
  }) => {
    const p = payload("DEL");
    await api.seed("warehouses", p);

    await page.goto("/warehouses");
    await expect(
      page.getByRole("cell", { name: p.name })
    ).toBeVisible({ timeout: 10_000 });

    // Abrir delete — segundo botón de la fila (Trash2)
    const row = page.getByRole("row").filter({ hasText: p.name });
    await row.getByRole("button").nth(1).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("¿Eliminar almacén?")).toBeVisible();

    // Confirmar eliminación
    await page.getByRole("button", { name: "Eliminar" }).click();

    // Soft-delete: el registro ya no aparece en la lista
    await expect(
      page.getByRole("cell", { name: p.name })
    ).not.toBeVisible({ timeout: 10_000 });
    // No se llama api.remove: la acción UI ya hizo el soft-delete
  });

  // ── 6. Búsqueda / filtro ──────────────────────────────────────────────────
  test("búsqueda: filtra la tabla por nombre correctamente", async ({
    page,
    api,
  }) => {
    const alfa = payload("SRCH-ALFA");
    const beta = payload("SRCH-BETA");
    const idAlfa = await api.seed("warehouses", alfa);
    const idBeta = await api.seed("warehouses", beta);

    try {
      await page.goto("/warehouses");

      // Esperar que ambos registros sean visibles antes de buscar
      await expect(
        page.getByRole("cell", { name: alfa.name })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("cell", { name: beta.name })
      ).toBeVisible({ timeout: 10_000 });

      // Buscar solo ALFA (debounce 300 ms + respuesta API)
      const searchInput = page.getByPlaceholder(
        "Buscar por nombre, ciudad o dirección..."
      );
      await searchInput.fill(alfa.name);

      // ALFA visible; BETA desaparece
      await expect(
        page.getByRole("cell", { name: alfa.name })
      ).toBeVisible({ timeout: 8_000 });
      await expect(
        page.getByRole("cell", { name: beta.name })
      ).not.toBeVisible();
    } finally {
      await api.remove("warehouses", idAlfa);
      await api.remove("warehouses", idBeta);
    }
  });
});
