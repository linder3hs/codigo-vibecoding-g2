import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { DriverForm } from "@/components/modules/drivers/DriverForm"
import type { Driver } from "@/types/driver"

// ─── mock DatePicker ──────────────────────────────────────────────────────────
// DatePicker es un Popover + Calendar — no interaccionable en jsdom.
// Se reemplaza con un <input> nativo que expone value/onChange directamente.

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

const existingDriver: Driver = {
  id: 4,
  user: 8,
  user_full_name: "Carlos Ramírez",
  user_email: "carlos@empresa.com",
  user_username: "carlos.r",
  transport: 2,
  license_number: "LIC-001234",
  license_expiry: "2027-06-30",
  phone: "+57 310 000 0000",
  is_active: true,
  created_at: "2026-02-10T09:00:00Z",
  updated_at: "2026-02-10T09:00:00Z",
}

const mockTransportResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 2,
      plate_number: "ABC-123",
      transport_type: "TRUCK",
      brand: "Ford",
      model: "Transit",
      year: 2022,
      capacity_kg: "1500.00",
      capacity_m3: "12.50",
      is_available: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
}

// ─── setup: mock de lista de transportes ──────────────────────────────────────

beforeEach(() => {
  server.use(
    http.get(`${BASE}/transport/`, () =>
      HttpResponse.json(mockTransportResponse),
    ),
  )
})

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <DriverForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  driver = existingDriver,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <DriverForm driver={driver} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("DriverForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("ID de usuario")).toBeInTheDocument()
    expect(screen.getByLabelText("Número de licencia")).toBeInTheDocument()
    // DatePicker mockeado con aria-label = placeholder
    expect(screen.getByLabelText("Seleccionar fecha")).toBeInTheDocument()
    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument()
    expect(screen.getByText("Transporte asignado (opcional)")).toBeInTheDocument()
    expect(screen.getByLabelText("Conductor activo")).toBeInTheDocument()
  })

  it("muestra botón 'Crear conductor' en modo creación", () => {
    renderCreate()
    expect(
      screen.getByRole("button", { name: "Crear conductor" }),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument()
  })

  it("en modo creación muestra el campo 'ID de usuario' editable", () => {
    renderCreate()
    expect(screen.getByLabelText("ID de usuario")).toBeInTheDocument()
  })

  it("en modo edición muestra nombre de usuario readonly y oculta el campo ID", () => {
    renderEdit()

    // Muestra el nombre como texto estático, no como input
    expect(screen.getByText("Carlos Ramírez (carlos.r)")).toBeInTheDocument()
    // El input de ID no debe estar presente
    expect(screen.queryByLabelText("ID de usuario")).not.toBeInTheDocument()
  })

  it("pre-carga campos con datos del conductor en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("LIC-001234")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2027-06-30")).toBeInTheDocument()
    expect(screen.getByDisplayValue("+57 310 000 0000")).toBeInTheDocument()
  })

  it("checkbox is_active está marcado por defecto en modo creación", () => {
    renderCreate()
    expect(screen.getByLabelText("Conductor activo")).toBeChecked()
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

describe("DriverForm — validación", () => {
  it("muestra errores en campos requeridos al enviar vacío", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() => {
      expect(
        screen.getByText("El número de licencia es requerido"),
      ).toBeInTheDocument()
    })

    expect(screen.getByText("La fecha de vencimiento es requerida")).toBeInTheDocument()
    expect(screen.getByText("El teléfono es requerido")).toBeInTheDocument()
  })

  it("muestra error de formato cuando license_expiry tiene formato incorrecto", async () => {
    const user = userEvent.setup()
    renderCreate()

    const datePicker = screen.getByLabelText("Seleccionar fecha")
    await user.type(datePicker, "30/06/2027")

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() => {
      expect(screen.getByText("Formato requerido: YYYY-MM-DD")).toBeInTheDocument()
    })
  })

  it("is_active con default true no genera error al enviar", async () => {
    const user = userEvent.setup()
    renderCreate()

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() => {
      expect(
        screen.getByText("El número de licencia es requerido"),
      ).toBeInTheDocument()
    })

    // is_active=true es válido — no debe aparecer ningún error relacionado con is_active
    // (el label "Conductor activo" siempre está presente en el DOM; verificamos que solo
    // aparecen errores de otros campos requeridos, no de is_active)
    expect(screen.queryByText(/is.active.*requerido|requerido.*is.active/i)).not.toBeInTheDocument()
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("DriverForm — submit creación", () => {
  it("envía POST /drivers/ con el payload correcto", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingDriver, id: 10, user: 9 },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    // ID de usuario
    const userIdInput = screen.getByLabelText("ID de usuario")
    await user.clear(userIdInput)
    await user.type(userIdInput, "9")

    // Número de licencia
    await user.type(screen.getByLabelText("Número de licencia"), "LIC-009999")

    // Fecha de vencimiento (mockeada como input de texto)
    await user.type(screen.getByLabelText("Seleccionar fecha"), "2028-12-31")

    // Teléfono
    await user.type(screen.getByLabelText("Teléfono"), "+57 320 111 1111")

    // transport se deja en null (sin asignar)

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      user: 9,
      license_number: "LIC-009999",
      license_expiry: "2028-12-31",
      phone: "+57 320 111 1111",
      transport: null,
      is_active: true,
    })
  })

  it("envía is_active=false cuando se desmarca el checkbox", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingDriver, is_active: false },
          { status: 201 },
        )
      }),
    )

    renderCreate()

    const userIdInput = screen.getByLabelText("ID de usuario")
    await user.clear(userIdInput)
    await user.type(userIdInput, "9")

    await user.type(screen.getByLabelText("Número de licencia"), "LIC-009999")
    await user.type(screen.getByLabelText("Seleccionar fecha"), "2028-12-31")
    await user.type(screen.getByLabelText("Teléfono"), "+57 320 111 1111")

    await user.click(screen.getByLabelText("Conductor activo"))

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.is_active).toBe(false),
    )
  })

  it("asigna transporte via Select y lo incluye en el payload", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(existingDriver, { status: 201 })
      }),
    )

    renderCreate()

    const userIdInput = screen.getByLabelText("ID de usuario")
    await user.clear(userIdInput)
    await user.type(userIdInput, "8")

    await user.type(screen.getByLabelText("Número de licencia"), "LIC-001234")
    await user.type(screen.getByLabelText("Seleccionar fecha"), "2027-06-30")
    await user.type(screen.getByLabelText("Teléfono"), "+57 310 000 0000")

    // Seleccionar transporte via Base UI Select
    await waitFor(() =>
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("combobox"))
    const transportOption = await screen.findByRole("option", { name: /ABC-123/ })
    fireEvent.pointerDown(transportOption)
    fireEvent.click(transportOption)

    await user.click(screen.getByRole("button", { name: "Crear conductor" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.transport).toBe(2),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("DriverForm — submit edición", () => {
  it("envía PATCH /drivers/:id/ sin incluir el campo user en el payload", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/drivers/4/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingDriver,
          phone: "+57 315 999 9999",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingDriver, onSuccess)

    const phoneInput = screen.getByDisplayValue("+57 310 000 0000")
    await user.clear(phoneInput)
    await user.type(phoneInput, "+57 315 999 9999")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/drivers/4/")
    expect(capturedBody).toMatchObject({ phone: "+57 315 999 9999" })
    // user no debe estar en el payload de actualización
    expect((capturedBody as Record<string, unknown>).user).toBeUndefined()
  })
})
