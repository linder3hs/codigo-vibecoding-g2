import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { SupplierForm } from "@/components/modules/suppliers/SupplierForm"
import type { Supplier } from "@/types/supplier"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingSupplier: Supplier = {
  id: 5,
  name: "Distribuidora Norte",
  contact_name: "Juan Pérez",
  email: "juan@norte.com",
  phone: "+57 300 1111111",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
  tax_id: "800111222-3",
  is_active: true,
  created_at: "2026-02-01T09:00:00Z",
  updated_at: "2026-02-01T09:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <SupplierForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEdit(
  supplier = existingSupplier,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <SupplierForm supplier={supplier} onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

// ─── render ───────────────────────────────────────────────────────────────────

describe("SupplierForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreate()

    expect(screen.getByLabelText("Nombre del proveedor")).toBeInTheDocument()
    expect(screen.getByLabelText("Nombre de contacto")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument()
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument()
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument()
    expect(screen.getByLabelText("País")).toBeInTheDocument()
    expect(screen.getByLabelText("NIT / Tax ID (opcional)")).toBeInTheDocument()
  })

  it("muestra botón 'Crear proveedor' en modo creación", () => {
    renderCreate()
    expect(
      screen.getByRole("button", { name: "Crear proveedor" }),
    ).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEdit()
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument()
  })

  it("pre-carga campos con datos del supplier en modo edición", () => {
    renderEdit()

    expect(screen.getByDisplayValue("Distribuidora Norte")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Juan Pérez")).toBeInTheDocument()
    expect(screen.getByDisplayValue("+57 300 1111111")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Calle 100 #10-20")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Bogotá")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Colombia")).toBeInTheDocument()
    expect(screen.getByDisplayValue("800111222-3")).toBeInTheDocument()
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

describe("SupplierForm — validación", () => {
  it("muestra errores para campos requeridos al enviar vacío", async () => {
    const user = userEvent.setup()
    renderCreate()

    // Limpiar el default "Colombia" del campo país
    await user.clear(screen.getByLabelText("País"))

    await user.click(screen.getByRole("button", { name: "Crear proveedor" }))

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })

    expect(
      screen.getByText("El nombre de contacto es requerido"),
    ).toBeInTheDocument()
    expect(screen.getByText("El teléfono es requerido")).toBeInTheDocument()
    expect(screen.getByText("La dirección es requerida")).toBeInTheDocument()
    expect(screen.getByText("La ciudad es requerida")).toBeInTheDocument()
    expect(screen.getByText("El país es requerido")).toBeInTheDocument()
    // email field tipo="email": jsdom sanitiza valor inválido → "" → dispara "El email es requerido"
    expect(screen.getByText("El email es requerido")).toBeInTheDocument()
  })

  it("no dispara error para tax_id vacío (campo opcional)", async () => {
    const user = userEvent.setup()

    server.use(
      http.post(`${BASE}/suppliers/`, async () =>
        HttpResponse.json(existingSupplier, { status: 201 }),
      ),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    await user.type(screen.getByLabelText("Nombre del proveedor"), "X")
    await user.type(screen.getByLabelText("Nombre de contacto"), "X")
    await user.type(screen.getByLabelText("Email"), "x@x.com")
    await user.type(screen.getByLabelText("Teléfono"), "123")
    await user.type(screen.getByLabelText("Dirección"), "X")
    await user.type(screen.getByLabelText("Ciudad"), "X")
    // tax_id se deja vacío — es opcional, no debe generar error

    await user.click(screen.getByRole("button", { name: "Crear proveedor" }))

    // Si el form validó OK sin tax_id, onSuccess se llama
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("SupplierForm — submit creación", () => {
  it("envía POST /suppliers/ con los valores del formulario", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingSupplier, id: 10, name: "Nuevo Proveedor" },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreate(onSuccess)

    await user.type(screen.getByLabelText("Nombre del proveedor"), "Nuevo Proveedor")
    await user.type(screen.getByLabelText("Nombre de contacto"), "Ana López")
    await user.type(screen.getByLabelText("Email"), "ana@proveedor.com")
    await user.type(screen.getByLabelText("Teléfono"), "300 000 000")
    await user.type(screen.getByLabelText("Dirección"), "Cra 7 #50-30")
    await user.type(screen.getByLabelText("Ciudad"), "Cali")
    // country tiene default "Colombia"

    await user.click(screen.getByRole("button", { name: "Crear proveedor" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      name: "Nuevo Proveedor",
      contact_name: "Ana López",
      phone: "300 000 000",
      address: "Cra 7 #50-30",
      city: "Cali",
      country: "Colombia",
    })
  })

  it("envía tax_id como null cuando se deja vacío", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...existingSupplier, tax_id: null }, { status: 201 })
      }),
    )

    renderCreate()

    await user.type(screen.getByLabelText("Nombre del proveedor"), "Sin NIT")
    await user.type(screen.getByLabelText("Nombre de contacto"), "Pedro")
    await user.type(screen.getByLabelText("Email"), "pedro@test.com")
    await user.type(screen.getByLabelText("Teléfono"), "300 111 000")
    await user.type(screen.getByLabelText("Dirección"), "Av. 68")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")
    // tax_id se deja vacío → debe enviarse como null

    await user.click(screen.getByRole("button", { name: "Crear proveedor" }))

    await waitFor(() =>
      expect((capturedBody as Record<string, unknown>)?.tax_id).toBeNull(),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("SupplierForm — submit edición", () => {
  it("envía PATCH /suppliers/:id/ en modo edición", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/suppliers/5/`, async ({ request }) => {
        patchedUrl = request.url
        capturedBody = await request.json()
        return HttpResponse.json({
          ...existingSupplier,
          contact_name: "Carlos Ruiz",
        })
      }),
    )

    const onSuccess = vi.fn()
    renderEdit(existingSupplier, onSuccess)

    const contactInput = screen.getByDisplayValue("Juan Pérez")
    await user.clear(contactInput)
    await user.type(contactInput, "Carlos Ruiz")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(patchedUrl).toContain("/suppliers/5/")
    expect(capturedBody).toMatchObject({ contact_name: "Carlos Ruiz" })
  })
})
