import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { WarehouseForm } from "@/components/modules/warehouses/WarehouseForm"
import type { Warehouse } from "@/types/warehouse"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingWarehouse: Warehouse = {
  id: 3,
  name: "CEDI Bogotá",
  address: "Zona Franca, Bodega 5",
  city: "Bogotá",
  country: "Colombia",
  latitude: 4.711,
  longitude: -74.0721,
  capacity_m3: "5000.00",
  is_active: true,
  created_at: "2026-01-10T08:00:00Z",
  updated_at: "2026-01-10T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <WarehouseForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  warehouse = existingWarehouse,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <WarehouseForm
      warehouse={warehouse}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("WarehouseForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("Nombre del almacén")).toBeInTheDocument()
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument()
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument()
    expect(screen.getByLabelText("País")).toBeInTheDocument()
    expect(screen.getByLabelText("Capacidad (m³)")).toBeInTheDocument()
    expect(screen.getByLabelText("Latitud (opcional)")).toBeInTheDocument()
    expect(screen.getByLabelText("Longitud (opcional)")).toBeInTheDocument()
  })

  it("muestra botón 'Crear almacén' en modo creación", () => {
    renderCreate()
    expect(screen.getByRole("button", { name: "Crear almacén" })).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })

  it("pre-carga campos con datos del warehouse en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("CEDI Bogotá")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Zona Franca, Bodega 5")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Bogotá")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Colombia")).toBeInTheDocument()
    // capacity_m3 llega como "5000.00" → parseFloat → 5000
    expect(screen.getByDisplayValue("5000")).toBeInTheDocument()
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

describe("WarehouseForm — validación", () => {
  it("muestra errores para campos requeridos al enviar vacío", async () => {
    const user = userEvent.setup()
    renderCreate()

    // Borrar el default "Colombia" del campo país
    await user.clear(screen.getByLabelText("País"))

    await user.click(screen.getByRole("button", { name: "Crear almacén" }))

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })

    expect(screen.getByText("La dirección es requerida")).toBeInTheDocument()
    expect(screen.getByText("La ciudad es requerida")).toBeInTheDocument()
    expect(screen.getByText("El país es requerido")).toBeInTheDocument()
    // capacity_m3 = undefined → falla con "Debe ser un número" (no pasó la guarda z.number)
    expect(screen.getByText("Debe ser un número")).toBeInTheDocument()
  })

  it("muestra error 'La capacidad debe ser mayor a 0' con valor 0", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText("Nombre del almacén"), "X")
    await user.type(screen.getByLabelText("Dirección"), "X")
    await user.type(screen.getByLabelText("Ciudad"), "X")

    const capacityInput = screen.getByLabelText("Capacidad (m³)")
    await user.type(capacityInput, "0")

    await user.click(screen.getByRole("button", { name: "Crear almacén" }))

    await waitFor(() => {
      expect(
        screen.getByText("La capacidad debe ser mayor a 0"),
      ).toBeInTheDocument()
    })
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("WarehouseForm — submit creación", () => {
  it("envía POST /warehouses/ con los valores del formulario", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingWarehouse, id: 10, name: "Nuevo CEDI" },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    await user.type(screen.getByLabelText("Nombre del almacén"), "Nuevo CEDI")
    await user.type(screen.getByLabelText("Dirección"), "Calle 80 #40-10")
    await user.type(screen.getByLabelText("Ciudad"), "Medellín")
    // country tiene default "Colombia"
    await user.type(screen.getByLabelText("Capacidad (m³)"), "3000")

    await user.click(screen.getByRole("button", { name: "Crear almacén" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      name: "Nuevo CEDI",
      address: "Calle 80 #40-10",
      city: "Medellín",
      country: "Colombia",
      capacity_m3: 3000,
    })
  })

  it("envía lat/long como null cuando se dejan vacíos", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...existingWarehouse, id: 11 }, { status: 201 })
      }),
    )

    renderCreate()

    await user.type(screen.getByLabelText("Nombre del almacén"), "CEDI Sur")
    await user.type(screen.getByLabelText("Dirección"), "Av. El Dorado")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")
    await user.type(screen.getByLabelText("Capacidad (m³)"), "2500")

    await user.click(screen.getByRole("button", { name: "Crear almacén" }))

    await waitFor(() =>
      expect(capturedBody).toMatchObject({ latitude: null, longitude: null }),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("WarehouseForm — submit edición", () => {
  it("envía PATCH /warehouses/:id/ en modo edición", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/warehouses/3/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingWarehouse,
          name: "CEDI Bogotá Actualizado",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingWarehouse, onSuccess)

    const nameInput = screen.getByDisplayValue("CEDI Bogotá")
    await user.clear(nameInput)
    await user.type(nameInput, "CEDI Bogotá Actualizado")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/warehouses/3/")
    expect(capturedBody).toMatchObject({ name: "CEDI Bogotá Actualizado" })
  })
})
