import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { RouteForm } from "@/components/modules/routes/RouteForm"
import type { Route } from "@/types/route"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingRoute: Route = {
  id: 5,
  name: "Ruta Cali - Pasto",
  origin_warehouse: 2,
  estimated_duration_hours: "6.00",
  estimated_distance_km: "330.00",
  is_active: true,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
}

const mockWarehousesResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 2,
      name: "Bodega Cali",
      address: "Calle 5 # 10-20",
      city: "Cali",
      country: "Colombia",
      capacity_m3: "500.00",
      is_active: true,
      latitude: null,
      longitude: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 3,
      name: "CEDI Bogotá",
      address: "Av. El Dorado",
      city: "Bogotá",
      country: "Colombia",
      capacity_m3: "1000.00",
      is_active: true,
      latitude: null,
      longitude: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
}

// ─── setup: mock de lista de almacenes ────────────────────────────────────────

beforeEach(() => {
  server.use(
    http.get(`${BASE}/warehouses/`, () =>
      HttpResponse.json(mockWarehousesResponse),
    ),
  )
})

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <RouteForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  route = existingRoute,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <RouteForm route={route} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("RouteForm — render", () => {
  it("muestra todos los campos en modo creación", async () => {
    renderCreate()

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
    // Almacén origen usa Radix Select (no native input) — verificar por texto del label
    expect(screen.getByText("Almacén origen")).toBeInTheDocument()
    expect(screen.getByLabelText("Distancia (km)")).toBeInTheDocument()
    expect(screen.getByLabelText("Duración estimada (horas)")).toBeInTheDocument()
  })

  it("muestra botón 'Crear ruta' en modo creación", () => {
    renderCreate()
    expect(screen.getByRole("button", { name: "Crear ruta" })).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })

  it("muestra 'Seleccionar almacén' como placeholder del Select", async () => {
    renderCreate()

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    expect(screen.getByText("Seleccionar almacén")).toBeInTheDocument()
  })

  it("pre-carga campos con datos de la ruta en modo edición", async () => {
    renderEdit()

    expect(screen.getByDisplayValue("Ruta Cali - Pasto")).toBeInTheDocument()
    // estimated_distance_km y estimated_duration_hours se pre-cargan como número parseado
    expect(screen.getByDisplayValue("330")).toBeInTheDocument()
    expect(screen.getByDisplayValue("6")).toBeInTheDocument()
  })

  it("pre-carga el almacén seleccionado en modo edición", async () => {
    renderEdit()

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    // origin_warehouse = 2 → "Bodega Cali"
    expect(screen.getByText("Bodega Cali")).toBeInTheDocument()
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

describe("RouteForm — validación", () => {
  it("muestra error en nombre cuando está vacío al enviar", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear ruta" }))

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })
  })

  it("muestra 'Selecciona un almacén' cuando no se elige almacén", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText("Nombre"), "Ruta Test")
    await user.click(screen.getByRole("button", { name: "Crear ruta" }))

    await waitFor(() => {
      expect(screen.getByText("Selecciona un almacén")).toBeInTheDocument()
    })
  })

  it("muestra 'Debe ser mayor a 0' para distancia y duración con default 0", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText("Nombre"), "Ruta Test")
    // origin_warehouse se queda vacío — la validación de positivo aplica a los numéricos
    await user.click(screen.getByRole("button", { name: "Crear ruta" }))

    await waitFor(() => {
      const msgs = screen.getAllByText("Debe ser mayor a 0")
      expect(msgs.length).toBeGreaterThanOrEqual(2)
    })
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("RouteForm — submit creación", () => {
  it("envía POST /routes/ con payload correcto", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 6,
            name: "Ruta Nueva",
            origin_warehouse: 3,
            estimated_duration_hours: "5.00",
            estimated_distance_km: "200.00",
            is_active: true,
            created_at: "2026-04-10T12:00:00Z",
            updated_at: "2026-04-10T12:00:00Z",
          },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    // Esperar a que carguen los almacenes
    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    await user.type(screen.getByLabelText("Nombre"), "Ruta Nueva")

    // Seleccionar almacén via Radix Select (userEvent para simular pointer events que Radix necesita)
    await user.click(screen.getByRole("combobox"))
    const warehouseOption = await screen.findByText("CEDI Bogotá")
    await user.click(warehouseOption)

    // Ingresar distancia y duración
    const distInput = screen.getByLabelText("Distancia (km)")
    await user.clear(distInput)
    await user.type(distInput, "200")

    const durInput = screen.getByLabelText("Duración estimada (horas)")
    await user.clear(durInput)
    await user.type(durInput, "5")

    await user.click(screen.getByRole("button", { name: "Crear ruta" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      name: "Ruta Nueva",
      origin_warehouse: 3,
      estimated_distance_km: 200,
      estimated_duration_hours: 5,
    })
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("RouteForm — submit edición", () => {
  it("envía PATCH /routes/:id/ con los datos actualizados", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/routes/5/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingRoute,
          name: "Ruta Cali - Pasto Actualizada",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingRoute, onSuccess)

    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )

    const nameInput = screen.getByDisplayValue("Ruta Cali - Pasto")
    await user.clear(nameInput)
    await user.type(nameInput, "Ruta Cali - Pasto Actualizada")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/routes/5/")
    expect(capturedBody).toMatchObject({
      name: "Ruta Cali - Pasto Actualizada",
      origin_warehouse: 2,
    })
  })
})
