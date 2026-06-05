import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { ShipmentForm } from "@/components/modules/shipments/ShipmentForm"
import type { Shipment } from "@/types/shipment"

// ─── mock DatePicker ──────────────────────────────────────────────────────────
// DatePicker es un Popover + Calendar — no interaccionable en jsdom.

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string
    onChange?: (v: string) => void
    placeholder?: string
  }) => (
    <input
      data-testid="date-picker"
      aria-label={placeholder ?? "Seleccionar fecha"}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder ?? "Seleccionar fecha"}
    />
  ),
}))

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-20260001",
  customer: 5,
  customer_name: "Empresa ABC",
  origin_warehouse: 3,
  destination_address: "Calle 10 # 20-30",
  destination_city: "Medellín",
  destination_country: "Colombia",
  status: "PENDING",
  estimated_delivery_date: "2026-05-15",
  driver: null,
  transport: null,
  route: null,
  notes: "",
  weight_total_kg: "5.00",
  base_cost: "0.00",
  calculated_cost: "50000.00",
  created_at: "2026-04-01T08:00:00Z",
  updated_at: "2026-04-01T08:00:00Z",
}

// ─── mock API responses ───────────────────────────────────────────────────────

const mockCustomers = {
  count: 1, next: null, previous: null,
  results: [{ id: 5, name: "Empresa ABC", customer_type: "COMPANY", email: "", phone: "", address: "", city: "", country: "", created_at: "", updated_at: "" }],
}

const mockWarehouses = {
  count: 2, next: null, previous: null,
  results: [
    { id: 3, name: "CEDI Bogotá", address: "", city: "Bogotá", country: "Colombia", capacity_m3: "1000.00", is_active: true, latitude: null, longitude: null, created_at: "", updated_at: "" },
    { id: 4, name: "Bodega Medellín", address: "", city: "Medellín", country: "Colombia", capacity_m3: "500.00", is_active: true, latitude: null, longitude: null, created_at: "", updated_at: "" },
  ],
}

const mockDrivers = {
  count: 1, next: null, previous: null,
  results: [{ id: 2, user: 10, user_full_name: "Carlos Gómez", user_email: "carlos@test.com", user_username: "cgomez", license_number: "LIC-001", license_expiry: "2027-01-01", transport: null, is_active: true, created_at: "", updated_at: "" }],
}

const mockTransport = {
  count: 1, next: null, previous: null,
  results: [{ id: 7, plate_number: "ABC-123", transport_type: "TRUCK", brand: "Kenworth", model: "T680", year: 2020, capacity_kg: "5000.00", created_at: "", updated_at: "" }],
}

const mockRoutes = {
  count: 1, next: null, previous: null,
  results: [{ id: 11, name: "Ruta Bogotá - Cali", origin_warehouse: 3, estimated_duration_hours: "6.00", estimated_distance_km: "450.00", is_active: true, created_at: "", updated_at: "" }],
}

// ─── setup: mocks de todas las listas ────────────────────────────────────────

beforeEach(() => {
  server.use(
    http.get(`${BASE}/customers/`, () => HttpResponse.json(mockCustomers)),
    http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockWarehouses)),
    http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockDrivers)),
    http.get(`${BASE}/transport/`, () => HttpResponse.json(mockTransport)),
    http.get(`${BASE}/routes/`, () => HttpResponse.json(mockRoutes)),
  )
})

// ─── helpers ──────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <ShipmentForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  shipment = existingShipment,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <ShipmentForm shipment={shipment} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("ShipmentForm — render", () => {
  it("muestra todos los labels en modo creación", async () => {
    renderCreate()

    // Labels de campos de texto (FormField)
    expect(screen.getByLabelText("Dirección destino")).toBeInTheDocument()
    expect(screen.getByLabelText("Ciudad destino")).toBeInTheDocument()
    expect(screen.getByLabelText("País destino")).toBeInTheDocument()
    expect(screen.getByLabelText("Notas (opcional)")).toBeInTheDocument()

    // Labels de selects (Controller — no hay association nativa)
    expect(screen.getByText("Cliente")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
    expect(screen.getByText("Almacén origen")).toBeInTheDocument()
  })

  it("muestra botón 'Crear envío' en modo creación", () => {
    renderCreate()
    expect(screen.getByRole("button", { name: "Crear envío" })).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })

  it("destination_country pre-rellena con 'Colombia' en modo creación", () => {
    renderCreate()
    expect(screen.getByDisplayValue("Colombia")).toBeInTheDocument()
  })

  it("pre-carga campos de texto con datos del envío en modo edición", () => {
    renderEdit()
    expect(screen.getByDisplayValue("Calle 10 # 20-30")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Medellín")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Colombia")).toBeInTheDocument()
  })

  it("hay al menos 6 comboboxes (selects)", async () => {
    renderCreate()
    const combos = screen.getAllByRole("combobox")
    expect(combos.length).toBeGreaterThanOrEqual(6)
  })

  it("botón Cancelar llama a onCancel", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderCreate(vi.fn(), onCancel)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("status tiene valor 'Pendiente' por defecto (PENDING)", async () => {
    renderCreate()

    // STATUS_LABELS["PENDING"] = "Pendiente" — se muestra en el trigger
    await waitFor(() =>
      expect(screen.getByText("Pendiente")).toBeInTheDocument(),
    )
  })
})

// ─── validación ───────────────────────────────────────────────────────────────

describe("ShipmentForm — validación", () => {
  it("muestra error en dirección destino cuando está vacía", async () => {
    const user = userEvent.setup()
    renderCreate()

    // destination_country = "Colombia" (válido), status = "PENDING" (válido)
    // Enviamos sin llenar customer, origin_warehouse, destination_address, etc.
    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() => {
      expect(screen.getByText("La dirección de destino es requerida")).toBeInTheDocument()
    })
  })

  it("muestra error en ciudad cuando está vacía", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() => {
      expect(screen.getByText("La ciudad de destino es requerida")).toBeInTheDocument()
    })
  })

  it("muestra 'Selecciona un cliente' si no se elige cliente", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() => {
      expect(screen.getByText("Selecciona un cliente")).toBeInTheDocument()
    })
  })

  it("muestra 'Selecciona un almacén de origen' si no se elige almacén", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() => {
      expect(screen.getByText("Selecciona un almacén de origen")).toBeInTheDocument()
    })
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("ShipmentForm — submit creación", () => {
  it("envía POST /shipments/ con payload correcto y llama onSuccess", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(existingShipment, { status: 201 })
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    // Esperar a que carguen las listas
    await waitFor(() => expect(screen.queryAllByText("Cargando...").length).toBe(0))

    // Seleccionar cliente (combobox[0])
    const combos = screen.getAllByRole("combobox")
    await user.click(combos[0])
    const clienteOpt = await screen.findByRole("option", { name: "Empresa ABC" })
    fireEvent.pointerDown(clienteOpt)
    fireEvent.click(clienteOpt)

    // Seleccionar almacén origen (combobox[2] — después de cliente y estado)
    await user.click(screen.getAllByRole("combobox")[2])
    const warehouseOpt = await screen.findByRole("option", { name: "CEDI Bogotá" })
    fireEvent.pointerDown(warehouseOpt)
    fireEvent.click(warehouseOpt)

    // Llenar campos de texto
    await user.type(screen.getByLabelText("Dirección destino"), "Calle 10 # 20-30")
    await user.type(screen.getByLabelText("Ciudad destino"), "Medellín")

    // País destino ya tiene "Colombia" por defecto

    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      customer: 5,
      origin_warehouse: 3,
      destination_address: "Calle 10 # 20-30",
      destination_city: "Medellín",
      destination_country: "Colombia",
      status: "PENDING",
    })
  })

  it("envía driver, transport, route como null cuando son '__none__'", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(existingShipment, { status: 201 })
      }),
    )

    renderCreate()

    await waitFor(() => expect(screen.queryAllByText("Cargando...").length).toBe(0))

    await user.click(screen.getAllByRole("combobox")[0])
    const clienteOpt2 = await screen.findByRole("option", { name: "Empresa ABC" })
    fireEvent.pointerDown(clienteOpt2)
    fireEvent.click(clienteOpt2)

    await user.click(screen.getAllByRole("combobox")[2])
    const warehouseOpt2 = await screen.findByRole("option", { name: "CEDI Bogotá" })
    fireEvent.pointerDown(warehouseOpt2)
    fireEvent.click(warehouseOpt2)

    await user.type(screen.getByLabelText("Dirección destino"), "Calle 10")
    await user.type(screen.getByLabelText("Ciudad destino"), "Bogotá")

    await user.click(screen.getByRole("button", { name: "Crear envío" }))

    await waitFor(() =>
      expect(capturedBody).not.toBeNull(),
    )

    const body = capturedBody as Record<string, unknown>
    expect(body.driver).toBeNull()
    expect(body.transport).toBeNull()
    expect(body.route).toBeNull()
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("ShipmentForm — submit edición", () => {
  it("envía PATCH /shipments/:id/ con datos actualizados", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/shipments/1/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingShipment,
          destination_city: "Cali",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingShipment, onSuccess)

    await waitFor(() => expect(screen.queryAllByText("Cargando...").length).toBe(0))

    const cityInput = screen.getByLabelText("Ciudad destino")
    await user.clear(cityInput)
    await user.type(cityInput, "Cali")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/shipments/1/")
    expect(capturedBody).toMatchObject({
      destination_city: "Cali",
      customer: 5,
      origin_warehouse: 3,
      status: "PENDING",
    })
  })
})
