import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { TransportForm } from "@/components/modules/transport/TransportForm"
import type { Transport } from "@/types/transport"

const BASE = "http://localhost:8000/api/v1"
const CURRENT_YEAR = new Date().getFullYear()

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingTransport: Transport = {
  id: 2,
  plate_number: "ABC-123",
  transport_type: "TRUCK",
  brand: "Ford",
  model: "Transit",
  year: 2022,
  capacity_kg: "1500.00",
  capacity_m3: "12.50",
  is_available: true,
  created_at: "2026-01-15T08:00:00Z",
  updated_at: "2026-01-15T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <TransportForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  transport = existingTransport,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <TransportForm transport={transport} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("TransportForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("Placa")).toBeInTheDocument()
    expect(screen.getByText("Tipo de transporte")).toBeInTheDocument()
    expect(screen.getByLabelText("Marca")).toBeInTheDocument()
    expect(screen.getByLabelText("Modelo")).toBeInTheDocument()
    expect(screen.getByLabelText("Año")).toBeInTheDocument()
    expect(screen.getByLabelText("Capacidad (kg)")).toBeInTheDocument()
    expect(screen.getByLabelText("Capacidad (m³)")).toBeInTheDocument()
    expect(
      screen.getByLabelText("El vehículo está disponible"),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Crear transporte' en modo creación", () => {
    renderCreate()
    expect(
      screen.getByRole("button", { name: "Crear transporte" }),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument()
  })

  it("pre-carga campos con datos del transporte en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("ABC-123")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Ford")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Transit")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2022")).toBeInTheDocument()
    // capacity_kg="1500.00" → parseFloat → 1500
    expect(screen.getByDisplayValue("1500")).toBeInTheDocument()
    // capacity_m3="12.50" → parseFloat → 12.5
    expect(screen.getByDisplayValue("12.5")).toBeInTheDocument()
  })

  it("checkbox is_available está marcado por defecto en modo creación", () => {
    renderCreate()
    const checkbox = screen.getByLabelText("El vehículo está disponible")
    expect(checkbox).toBeChecked()
  })

  it("checkbox is_available refleja el estado del transporte en modo edición", () => {
    renderEdit({ ...existingTransport, is_available: false })
    const checkbox = screen.getByLabelText("El vehículo está disponible")
    expect(checkbox).not.toBeChecked()
  })

  it("campo year tiene el año actual como default en modo creación", () => {
    renderCreate()
    expect(screen.getByDisplayValue(String(CURRENT_YEAR))).toBeInTheDocument()
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

describe("TransportForm — validación", () => {
  it("muestra errores en campos de texto requeridos al enviar vacío", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.clear(screen.getByLabelText("Placa"))
    await user.clear(screen.getByLabelText("Marca"))
    await user.clear(screen.getByLabelText("Modelo"))

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() => {
      expect(screen.getByText("La placa es requerida")).toBeInTheDocument()
    })
    expect(screen.getByText("La marca es requerida")).toBeInTheDocument()
    expect(screen.getByText("El modelo es requerido")).toBeInTheDocument()
  })

  it("muestra errores en capacity_kg y capacity_m3 con default 0", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText("Placa"), "TEST-001")
    await user.type(screen.getByLabelText("Marca"), "Ford")
    await user.type(screen.getByLabelText("Modelo"), "Transit")
    // year tiene default válido, capacidades tienen default 0

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() => {
      expect(
        screen.getAllByText("La capacidad debe ser mayor a 0"),
      ).toHaveLength(2)
    })
  })

  it("transport_type con default 'TRUCK' no genera error", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() => {
      expect(screen.getByText("La placa es requerida")).toBeInTheDocument()
    })

    expect(
      screen.queryByText("El tipo de transporte es requerido"),
    ).not.toBeInTheDocument()
  })

  it("year por defecto (año actual) no genera error", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() => {
      expect(screen.getByText("La placa es requerida")).toBeInTheDocument()
    })

    expect(screen.queryByText("Año mínimo 1990")).not.toBeInTheDocument()
    expect(screen.queryByText("Año inválido")).not.toBeInTheDocument()
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("TransportForm — submit creación", () => {
  it("envía POST /transport/ con los valores del formulario", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/transport/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingTransport, id: 10, plate_number: "XYZ-999" },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    await user.type(screen.getByLabelText("Placa"), "XYZ-999")
    // transport_type default es TRUCK — no necesita cambio

    await user.type(screen.getByLabelText("Marca"), "Renault")
    await user.type(screen.getByLabelText("Modelo"), "Master")

    // year default es el año actual (válido); limpiar y escribir uno específico
    const yearInput = screen.getByLabelText("Año")
    await user.clear(yearInput)
    await user.type(yearInput, "2023")

    const kgInput = screen.getByLabelText("Capacidad (kg)")
    await user.clear(kgInput)
    await user.type(kgInput, "800")

    const m3Input = screen.getByLabelText("Capacidad (m³)")
    await user.clear(m3Input)
    await user.type(m3Input, "8")

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      plate_number: "XYZ-999",
      transport_type: "TRUCK",
      brand: "Renault",
      model: "Master",
      year: 2023,
      capacity_kg: 800,
      capacity_m3: 8,
      is_available: true,
    })
  })

  it("envía is_available=false cuando se desmarca el checkbox", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/transport/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingTransport, is_available: false },
          { status: 201 },
        )
      }),
    )

    renderCreate()

    await user.type(screen.getByLabelText("Placa"), "MOTO-01")
    await user.type(screen.getByLabelText("Marca"), "Honda")
    await user.type(screen.getByLabelText("Modelo"), "CB500")

    // Seleccionar MOTORCYCLE via Select
    fireEvent.click(screen.getByText("Camión"))
    const motoOption = await screen.findByText("Moto")
    fireEvent.click(motoOption)

    const kgInput = screen.getByLabelText("Capacidad (kg)")
    await user.clear(kgInput)
    await user.type(kgInput, "100")

    const m3Input = screen.getByLabelText("Capacidad (m³)")
    await user.clear(m3Input)
    await user.type(m3Input, "0.5")

    // Desmarcar el checkbox
    await user.click(screen.getByLabelText("El vehículo está disponible"))

    await user.click(screen.getByRole("button", { name: "Crear transporte" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.is_available).toBe(false),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("TransportForm — submit edición", () => {
  it("envía PATCH /transport/:id/ en modo edición", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/transport/2/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingTransport,
          plate_number: "ABC-456",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingTransport, onSuccess)

    const plateInput = screen.getByDisplayValue("ABC-123")
    await user.clear(plateInput)
    await user.type(plateInput, "ABC-456")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/transport/2/")
    expect(capturedBody).toMatchObject({ plate_number: "ABC-456" })
  })
})
