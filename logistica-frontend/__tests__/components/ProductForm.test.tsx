import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { ProductForm } from "@/components/modules/products/ProductForm"
import type { Product } from "@/types/product"

const BASE = "http://localhost:8000/api/v1"

// ─── fixtures ─────────────────────────────────────────────────────────────────

const existingProduct: Product = {
  id: 7,
  name: "Caja corrugada",
  sku: "PROD-001",
  category: "Embalaje",
  supplier: 5,
  warehouse: 3,
  weight_kg: "2.50",
  width_cm: "30.00",
  height_cm: "20.00",
  depth_cm: "15.00",
  unit_price: "9500.00",
  stock_quantity: 200,
  description: "Caja de cartón corrugado",
  is_active: true,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
}

const mockSuppliersResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 5,
      name: "Distribuidora Norte",
      contact_name: "Juan Pérez",
      email: "juan@norte.com",
      phone: "300 000 000",
      address: "Calle 1",
      city: "Bogotá",
      country: "Colombia",
      tax_id: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
}

const mockWarehousesResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 3,
      name: "CEDI Bogotá",
      address: "Zona Franca, Bodega 5",
      city: "Bogotá",
      country: "Colombia",
      latitude: null,
      longitude: null,
      capacity_m3: "5000.00",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
}

// ─── setup: mocks de listas (requeridos por los Select del form) ──────────────

beforeEach(() => {
  server.use(
    http.get(`${BASE}/suppliers/`, () =>
      HttpResponse.json(mockSuppliersResponse),
    ),
    http.get(`${BASE}/warehouses/`, () =>
      HttpResponse.json(mockWarehousesResponse),
    ),
  )
})

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <ProductForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  product = existingProduct,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <ProductForm product={product} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("ProductForm — render", () => {
  it("muestra todos los campos de texto en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.getByLabelText("SKU")).toBeInTheDocument()
    expect(screen.getByLabelText("Categoría")).toBeInTheDocument()
    expect(screen.getByLabelText("Precio unitario")).toBeInTheDocument()
    expect(screen.getByLabelText("Stock")).toBeInTheDocument()
    expect(screen.getByLabelText("Peso (kg)")).toBeInTheDocument()
    expect(screen.getByLabelText("Ancho (cm)")).toBeInTheDocument()
    expect(screen.getByLabelText("Alto (cm)")).toBeInTheDocument()
    expect(screen.getByLabelText("Profundidad (cm)")).toBeInTheDocument()
    expect(screen.getByLabelText("Descripción (opcional)")).toBeInTheDocument()
  })

  it("muestra los labels de los Select", () => {
    renderCreate()

    // Los Select no son inputs nativos; se buscan por el texto del label
    expect(screen.getByText("Proveedor")).toBeInTheDocument()
    expect(screen.getByText("Almacén")).toBeInTheDocument()
  })

  it("muestra botón 'Crear producto' en modo creación", () => {
    renderCreate()
    expect(
      screen.getByRole("button", { name: "Crear producto" }),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument()
  })

  it("pre-carga los campos de texto con datos del producto en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("Caja corrugada")).toBeInTheDocument()
    expect(screen.getByDisplayValue("PROD-001")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Embalaje")).toBeInTheDocument()
    // Campos numéricos: unit_price="9500.00" → parseFloat → 9500
    expect(screen.getByDisplayValue("9500")).toBeInTheDocument()
    expect(screen.getByDisplayValue("200")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2.5")).toBeInTheDocument()
    expect(screen.getByDisplayValue("30")).toBeInTheDocument()
    expect(screen.getByDisplayValue("20")).toBeInTheDocument()
    expect(screen.getByDisplayValue("15")).toBeInTheDocument()
  })

  it("pre-carga description en modo edición", () => {
    renderEdit()
    expect(
      screen.getByDisplayValue("Caja de cartón corrugado"),
    ).toBeInTheDocument()
  })

  it("botón Cancelar llama a onCancel", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderCreate(vi.fn(), onCancel)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

// ─── validación ───────────────────────────────────────────────────────────────

describe("ProductForm — validación", () => {
  it("muestra errores en campos de texto vacíos al enviar", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })

    expect(screen.getByText("El SKU es requerido")).toBeInTheDocument()
    expect(screen.getByText("La categoría es requerida")).toBeInTheDocument()
  })

  it("muestra errores en Select vacíos (supplier y warehouse)", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => {
      expect(screen.getByText("Selecciona un proveedor")).toBeInTheDocument()
    })
    expect(screen.getByText("Selecciona un almacén")).toBeInTheDocument()
  })

  it("muestra errores en campos numéricos con default 0", async () => {
    const user = userEvent.setup()
    renderCreate()

    // Primero llenar los campos de texto para que solo fallen los numéricos
    await user.type(screen.getByLabelText("Nombre"), "Test")
    await user.type(screen.getByLabelText("SKU"), "TEST-001")
    await user.type(screen.getByLabelText("Categoría"), "Test")

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => {
      expect(screen.getByText("El peso debe ser mayor a 0")).toBeInTheDocument()
    })

    expect(screen.getByText("El ancho debe ser mayor a 0")).toBeInTheDocument()
    expect(screen.getByText("El alto debe ser mayor a 0")).toBeInTheDocument()
    expect(screen.getByText("La profundidad debe ser mayor a 0")).toBeInTheDocument()
    expect(screen.getByText("El precio debe ser mayor a 0")).toBeInTheDocument()
  })

  it("stock_quantity con default 0 no genera error (mínimo permitido)", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => {
      // Esperamos que se muestren errores (para confirmar que el form validó)
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })

    // stock_quantity=0 es válido, no debe mostrar error de stock
    expect(
      screen.queryByText("El stock no puede ser negativo"),
    ).not.toBeInTheDocument()
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("ProductForm — submit creación", () => {
  it("envía POST /products/ con los valores del formulario", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingProduct, id: 10, name: "Nuevo Producto" },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    // Rellenar campos de texto
    await user.type(screen.getByLabelText("Nombre"), "Nuevo Producto")
    await user.type(screen.getByLabelText("SKU"), "NEW-001")
    await user.type(screen.getByLabelText("Categoría"), "Embalaje")

    // Seleccionar proveedor via Radix Select: click trigger → esperar opción → click opción
    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText("Seleccionar proveedor"))
    const supplierOption = await screen.findByText("Distribuidora Norte")
    fireEvent.click(supplierOption)

    // Seleccionar almacén
    fireEvent.click(screen.getByText("Seleccionar almacén"))
    const warehouseOption = await screen.findByText("CEDI Bogotá")
    fireEvent.click(warehouseOption)

    // Rellenar campos numéricos (borrar el 0 por defecto antes de escribir)
    const priceInput = screen.getByLabelText("Precio unitario")
    await user.clear(priceInput)
    await user.type(priceInput, "9500")

    const weightInput = screen.getByLabelText("Peso (kg)")
    await user.clear(weightInput)
    await user.type(weightInput, "2.5")

    const widthInput = screen.getByLabelText("Ancho (cm)")
    await user.clear(widthInput)
    await user.type(widthInput, "30")

    const heightInput = screen.getByLabelText("Alto (cm)")
    await user.clear(heightInput)
    await user.type(heightInput, "20")

    const depthInput = screen.getByLabelText("Profundidad (cm)")
    await user.clear(depthInput)
    await user.type(depthInput, "15")

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      name: "Nuevo Producto",
      sku: "NEW-001",
      category: "Embalaje",
      supplier: 5,
      warehouse: 3,
      unit_price: 9500,
      weight_kg: 2.5,
    })
  })

  it("description vacía se envía como undefined (no incluida en payload)", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...existingProduct, description: null }, { status: 201 })
      }),
    )

    renderCreate()

    await user.type(screen.getByLabelText("Nombre"), "X")
    await user.type(screen.getByLabelText("SKU"), "X-001")
    await user.type(screen.getByLabelText("Categoría"), "X")

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText("Seleccionar proveedor"))
    const supplierOpt = await screen.findByText("Distribuidora Norte")
    fireEvent.click(supplierOpt)

    fireEvent.click(screen.getByText("Seleccionar almacén"))
    const warehouseOpt = await screen.findByText("CEDI Bogotá")
    fireEvent.click(warehouseOpt)

    const priceInput = screen.getByLabelText("Precio unitario")
    await user.clear(priceInput)
    await user.type(priceInput, "100")

    const weightInput = screen.getByLabelText("Peso (kg)")
    await user.clear(weightInput)
    await user.type(weightInput, "1")

    const widthInput = screen.getByLabelText("Ancho (cm)")
    await user.clear(widthInput)
    await user.type(widthInput, "10")

    const heightInput = screen.getByLabelText("Alto (cm)")
    await user.clear(heightInput)
    await user.type(heightInput, "10")

    const depthInput = screen.getByLabelText("Profundidad (cm)")
    await user.clear(depthInput)
    await user.type(depthInput, "10")

    // description se deja vacía
    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.description).toBeUndefined(),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("ProductForm — submit edición", () => {
  it("envía PATCH /products/:id/ en modo edición", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/products/7/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({ ...existingProduct, name: "Caja Actualizada" })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingProduct, onSuccess)

    const nameInput = screen.getByDisplayValue("Caja corrugada")
    await user.clear(nameInput)
    await user.type(nameInput, "Caja Actualizada")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/products/7/")
    expect(capturedBody).toMatchObject({ name: "Caja Actualizada" })
  })
})
