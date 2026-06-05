import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { ItemForm } from "@/components/modules/shipments/ItemForm"

const BASE = "http://localhost:8000/api/v1"

// ─── mock de productos ────────────────────────────────────────────────────────

const mockProducts = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 7, name: "Laptop Pro", sku: "SKU-001", description: "", price: "2500000.00", weight_kg: "2.50", supplier: 1, warehouse: 3, is_active: true, created_at: "", updated_at: "" },
    { id: 8, name: "Monitor 27", sku: "SKU-002", description: "", price: "950000.00", weight_kg: "5.00", supplier: 1, warehouse: 3, is_active: true, created_at: "", updated_at: "" },
  ],
}

const mockCreatedItem = {
  id: 10,
  shipment: 1,
  product: 7,
  product_name: "Laptop Pro",
  product_sku: "SKU-001",
  quantity: 2,
  unit_price_at_time: "9500.00",
  subtotal: "19000.00",
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-04-01T09:00:00Z",
}

beforeEach(() => {
  server.use(
    http.get(`${BASE}/products/`, () => HttpResponse.json(mockProducts)),
  )
})

// ─── helpers ──────────────────────────────────────────────────────────────────

function renderForm(
  shipmentId = 1,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <ItemForm shipmentId={shipmentId} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("ItemForm — render", () => {
  it("muestra label 'Producto'", () => {
    renderForm()
    expect(screen.getByText("Producto")).toBeInTheDocument()
  })

  it("muestra label 'Cantidad'", () => {
    renderForm()
    expect(screen.getByLabelText("Cantidad")).toBeInTheDocument()
  })

  it("muestra label 'Precio unitario'", () => {
    renderForm()
    expect(screen.getByLabelText("Precio unitario")).toBeInTheDocument()
  })

  it("muestra botón 'Agregar ítem'", () => {
    renderForm()
    expect(screen.getByRole("button", { name: "Agregar ítem" })).toBeInTheDocument()
  })

  it("quantity default = 1 (input)", () => {
    renderForm()
    expect(screen.getByLabelText("Cantidad")).toHaveValue(1)
  })

  it("unit_price_at_time default = 0 (input)", () => {
    renderForm()
    expect(screen.getByLabelText("Precio unitario")).toHaveValue(0)
  })

  it("botón Cancelar llama a onCancel", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderForm(1, vi.fn(), onCancel)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("muestra placeholder 'Seleccionar producto' en el select (SelectValue)", async () => {
    renderForm()

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    expect(screen.getByText("Seleccionar producto")).toBeInTheDocument()
  })

  it("después de cargar, muestra opciones de producto en el select", async () => {
    const user = userEvent.setup()
    renderForm()

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByText("Laptop Pro — SKU-001")).toBeInTheDocument()
    expect(screen.getByText("Monitor 27 — SKU-002")).toBeInTheDocument()
  })
})

// ─── validación ───────────────────────────────────────────────────────────────

describe("ItemForm — validación", () => {
  it("muestra 'Selecciona un producto' si no se elige producto", async () => {
    const user = userEvent.setup()
    renderForm()

    // unit_price_at_time = 0 → falla positive; fijar valor válido para aislar este error
    fireEvent.change(screen.getByLabelText("Precio unitario"), {
      target: { value: "9500", valueAsNumber: 9500 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() => {
      expect(screen.getByText("Selecciona un producto")).toBeInTheDocument()
    })
  })

  it("muestra 'Debe ser mayor a 0' si unit_price_at_time = 0", async () => {
    const user = userEvent.setup()
    renderForm()

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    // Seleccionar un producto para aislar el error de precio
    await user.click(screen.getByRole("combobox"))
    const opt1 = await screen.findByRole("option", { name: /Laptop Pro/ })
    fireEvent.pointerDown(opt1)
    fireEvent.click(opt1)

    // unit_price_at_time sigue en 0 (default)
    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() => {
      expect(screen.getByText("Debe ser mayor a 0")).toBeInTheDocument()
    })
  })

  it("muestra 'Mínimo 1' si quantity = 0", async () => {
    const user = userEvent.setup()
    renderForm()

    fireEvent.change(screen.getByLabelText("Cantidad"), {
      target: { value: "0", valueAsNumber: 0 },
    })
    fireEvent.change(screen.getByLabelText("Precio unitario"), {
      target: { value: "9500", valueAsNumber: 9500 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() => {
      expect(screen.getByText("Mínimo 1")).toBeInTheDocument()
    })
  })
})

// ─── submit ───────────────────────────────────────────────────────────────────

describe("ItemForm — submit", () => {
  it("envía POST /shipments/:id/items/ con payload correcto y llama onSuccess", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/1/items/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockCreatedItem, { status: 201 })
      }),
    )

    const onSuccess = vi.fn()
    renderForm(1, onSuccess)

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    // Seleccionar producto
    await user.click(screen.getByRole("combobox"))
    const opt2 = await screen.findByRole("option", { name: /Laptop Pro/ })
    fireEvent.pointerDown(opt2)
    fireEvent.click(opt2)

    // Cantidad (default 1 es válido)
    // Precio unitario: cambiar de 0 a valor válido
    fireEvent.change(screen.getByLabelText("Precio unitario"), {
      target: { value: "9500", valueAsNumber: 9500 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      product: 7,
      quantity: 1,
      unit_price_at_time: "9500",
    })
  })

  it("unit_price_at_time se envía como string en el payload", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/1/items/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockCreatedItem, { status: 201 })
      }),
    )

    renderForm(1, vi.fn())

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole("combobox"))
    const opt3 = await screen.findByRole("option", { name: /Monitor 27/ })
    fireEvent.pointerDown(opt3)
    fireEvent.click(opt3)

    fireEvent.change(screen.getByLabelText("Cantidad"), {
      target: { value: "3", valueAsNumber: 3 },
    })
    fireEvent.change(screen.getByLabelText("Precio unitario"), {
      target: { value: "25000", valueAsNumber: 25000 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() =>
      expect(capturedBody).not.toBeNull(),
    )

    const body = capturedBody as Record<string, unknown>
    expect(typeof body.unit_price_at_time).toBe("string")
    expect(body.unit_price_at_time).toBe("25000")
    expect(body.product).toBe(8)
    expect(body.quantity).toBe(3)
  })

  it("usa el shipmentId correcto en la URL del endpoint", async () => {
    const user = userEvent.setup()
    let capturedUrl: string | null = null

    server.use(
      http.post(`${BASE}/shipments/42/items/`, async ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockCreatedItem, { status: 201 })
      }),
    )

    renderForm(42, vi.fn())

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole("combobox"))
    const opt4 = await screen.findByRole("option", { name: /Laptop Pro/ })
    fireEvent.pointerDown(opt4)
    fireEvent.click(opt4)

    fireEvent.change(screen.getByLabelText("Precio unitario"), {
      target: { value: "9500", valueAsNumber: 9500 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar ítem" }))

    await waitFor(() => expect(capturedUrl).not.toBeNull())

    expect(capturedUrl).toContain("/shipments/42/items/")
  })
})
