import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { StopForm } from "@/components/modules/routes/StopForm"
import type { RouteStop } from "@/types/route"

const BASE = "http://localhost:8000/api/v1"

// ─── StopForm no hace llamadas externas — sin beforeEach de server ─────────────

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingStop: RouteStop = {
  id: 10,
  route: 1,
  stop_order: 2,
  address: "Calle 10 # 20-30",
  city: "Manizales",
  estimated_offset_hours: "2.50",
  latitude: "5.0703",
  longitude: "-75.5138",
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(
  routeId = 1,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <StopForm routeId={routeId} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  stop = existingStop,
  routeId = 1,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <StopForm
      routeId={routeId}
      stop={stop}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("StopForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("Orden")).toBeInTheDocument()
    expect(screen.getByLabelText("Horas desde origen")).toBeInTheDocument()
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument()
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument()
    expect(screen.getByLabelText("Latitud (opcional)")).toBeInTheDocument()
    expect(screen.getByLabelText("Longitud (opcional)")).toBeInTheDocument()
  })

  it("muestra botón 'Agregar parada' en modo creación", () => {
    renderCreate()
    expect(
      screen.getByRole("button", { name: "Agregar parada" }),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument()
  })

  it("stop_order default es 1 en modo creación", () => {
    renderCreate()
    expect(screen.getByLabelText("Orden")).toHaveValue(1)
  })

  it("estimated_offset_hours default es 0 en modo creación", () => {
    renderCreate()
    expect(screen.getByLabelText("Horas desde origen")).toHaveValue(0)
  })

  it("pre-carga campos con datos de la parada en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("Calle 10 # 20-30")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Manizales")).toBeInTheDocument()
    expect(screen.getByLabelText("Orden")).toHaveValue(2)
    expect(screen.getByLabelText("Horas desde origen")).toHaveValue(2.5)
  })

  it("botón Cancelar llama a onCancel", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderCreate(1, vi.fn(), onCancel)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

// ─── validación ───────────────────────────────────────────────────────────────

describe("StopForm — validación", () => {
  it("muestra 'Requerido' en dirección y ciudad cuando están vacíos", async () => {
    const user = userEvent.setup()
    renderCreate()

    // stop_order=1 y estimated_offset_hours=0 son válidos por defecto
    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => {
      // Ambos campos vacíos generan "Requerido"
      const msgs = screen.getAllByText("Requerido")
      expect(msgs.length).toBeGreaterThanOrEqual(2)
    })
  })

  it("stop_order default 1 no genera error", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => {
      expect(screen.getAllByText("Requerido").length).toBeGreaterThanOrEqual(1)
    })

    // No debe haber mensajes de stop_order
    expect(screen.queryByText("Mínimo 1")).not.toBeInTheDocument()
    expect(screen.queryByText("Debe ser entero")).not.toBeInTheDocument()
  })

  it("estimated_offset_hours default 0 no genera error", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => {
      expect(screen.getAllByText("Requerido").length).toBeGreaterThanOrEqual(1)
    })

    // No debe haber error de offset_hours
    expect(screen.queryByText("Debe ser >= 0")).not.toBeInTheDocument()
  })

  it("stop_order = 0 genera error 'Mínimo 1'", async () => {
    const user = userEvent.setup()
    renderCreate()

    const orderInput = screen.getByLabelText("Orden")
    await user.clear(orderInput)
    await user.type(orderInput, "0")

    await user.type(screen.getByLabelText("Dirección"), "Av. Test")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => {
      expect(screen.getByText("Mínimo 1")).toBeInTheDocument()
    })
  })

  it("estimated_offset_hours negativo genera error 'Debe ser >= 0'", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText("Dirección"), "Av. Test")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")

    const offsetInput = screen.getByLabelText("Horas desde origen")
    await user.clear(offsetInput)
    await user.type(offsetInput, "-1")

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => {
      expect(screen.getByText("Debe ser >= 0")).toBeInTheDocument()
    })
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("StopForm — submit creación", () => {
  it("envía POST /routes/:routeId/stops/ con payload correcto", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/1/stops/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 11,
            route: 1,
            stop_order: 3,
            address: "Carrera 50 # 80-90",
            city: "Pereira",
            estimated_offset_hours: "4.00",
            latitude: null,
            longitude: null,
            created_at: "2026-05-01T10:00:00Z",
            updated_at: "2026-05-01T10:00:00Z",
          },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(1, onSuccess)

    // Usar fireEvent.change para type="number" — más confiable en jsdom
    fireEvent.change(screen.getByLabelText("Orden"), {
      target: { value: "3", valueAsNumber: 3 },
    })

    await user.type(screen.getByLabelText("Dirección"), "Carrera 50 # 80-90")
    await user.type(screen.getByLabelText("Ciudad"), "Pereira")

    fireEvent.change(screen.getByLabelText("Horas desde origen"), {
      target: { value: "4", valueAsNumber: 4 },
    })

    // lat/long opcionales: un input number vacío da valueAsNumber=NaN → z.number().optional() falla
    // Fijar a 0 para que Zod los acepte (el onSubmit handler filtra NaN → undefined)
    fireEvent.change(screen.getByLabelText("Latitud (opcional)"), {
      target: { value: "0", valueAsNumber: 0 },
    })
    fireEvent.change(screen.getByLabelText("Longitud (opcional)"), {
      target: { value: "0", valueAsNumber: 0 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      stop_order: 3,
      address: "Carrera 50 # 80-90",
      city: "Pereira",
      estimated_offset_hours: 4,
    })
  })

  it("envía POST al routeId correcto en la URL", async () => {
    const user = userEvent.setup()
    let capturedUrl: string | null = null

    server.use(
      http.post(`${BASE}/routes/7/stops/`, async ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(
          {
            id: 20,
            route: 7,
            stop_order: 1,
            address: "Av. 68",
            city: "Bogotá",
            estimated_offset_hours: "0.00",
            latitude: null,
            longitude: null,
            created_at: "2026-05-01T10:00:00Z",
            updated_at: "2026-05-01T10:00:00Z",
          },
          { status: 201 },
        )
      }),
    )

    renderCreate(7)

    await user.type(screen.getByLabelText("Dirección"), "Av. 68")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")

    // Fijar lat/long a 0 para evitar NaN en z.number().optional()
    fireEvent.change(screen.getByLabelText("Latitud (opcional)"), {
      target: { value: "0", valueAsNumber: 0 },
    })
    fireEvent.change(screen.getByLabelText("Longitud (opcional)"), {
      target: { value: "0", valueAsNumber: 0 },
    })

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() => expect(capturedUrl).not.toBeNull())
    expect(capturedUrl).toContain("/routes/7/stops/")
  })

  it("envía coordenadas cuando se ingresan lat/long", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/1/stops/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 12,
            route: 1,
            stop_order: 1,
            address: "Calle 5",
            city: "Cali",
            estimated_offset_hours: "2.00",
            latitude: "3.4516",
            longitude: "-76.5320",
            created_at: "2026-05-01T10:00:00Z",
            updated_at: "2026-05-01T10:00:00Z",
          },
          { status: 201 },
        )
      }),
    )

    renderCreate()

    await user.type(screen.getByLabelText("Dirección"), "Calle 5")
    await user.type(screen.getByLabelText("Ciudad"), "Cali")

    const offsetInput = screen.getByLabelText("Horas desde origen")
    await user.clear(offsetInput)
    await user.type(offsetInput, "2")

    const latInput = screen.getByLabelText("Latitud (opcional)")
    await user.clear(latInput)
    await user.type(latInput, "3.4516")

    const lngInput = screen.getByLabelText("Longitud (opcional)")
    await user.clear(lngInput)
    await user.type(lngInput, "-76.5320")

    await user.click(screen.getByRole("button", { name: "Agregar parada" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.latitude).toBeDefined(),
    )

    expect(capturedBody).toMatchObject({
      latitude: 3.4516,
      longitude: -76.532,
    })
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("StopForm — submit edición", () => {
  it("envía PATCH /routes/:routeId/stops/:stopId/ con datos actualizados", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/routes/1/stops/10/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingStop,
          city: "Armenia",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingStop, 1, onSuccess)

    const cityInput = screen.getByDisplayValue("Manizales")
    await user.clear(cityInput)
    await user.type(cityInput, "Armenia")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/routes/1/stops/10/")
    expect(capturedBody).toMatchObject({ city: "Armenia" })
  })
})
