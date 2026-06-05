import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { CustomerForm } from "@/components/modules/customers/CustomerForm"
import type { Customer } from "@/types/customer"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const existingCustomer: Customer = {
  id: 5,
  name: "Empresa Editada",
  customer_type: "COMPANY",
  tax_id: "900000000-0",
  email: "empresa@edit.com",
  phone: "+57 310 0000000",
  address: "Cra 10 #50-30",
  city: "Medellín",
  country: "Colombia",
  is_active: true,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
}

// ─── render helpers ───────────────────────────────────────────────────────────

function renderCreateForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return renderWithQuery(
    <CustomerForm onSuccess={onSuccess} onCancel={onCancel} />,
  )
}

function renderEditForm(
  customer = existingCustomer,
  onSuccess = vi.fn(),
  onCancel = vi.fn(),
) {
  return renderWithQuery(
    <CustomerForm
      customer={customer}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  )
}

// ─── estructura del formulario ────────────────────────────────────────────────

describe("CustomerForm — render", () => {
  it("muestra todos los campos en modo creación", () => {
    renderCreateForm()

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument()
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument()
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument()
    expect(screen.getByLabelText("País")).toBeInTheDocument()
    expect(screen.getByLabelText(/NIT \/ Tax ID/i)).toBeInTheDocument()
  })

  it("muestra botón 'Crear cliente' en modo creación", () => {
    renderCreateForm()
    expect(screen.getByRole("button", { name: "Crear cliente" })).toBeInTheDocument()
  })

  it("muestra botón 'Guardar cambios' en modo edición", () => {
    renderEditForm()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })

  it("pre-carga los campos con los datos del customer en modo edición", () => {
    renderEditForm()

    expect(screen.getByDisplayValue("Empresa Editada")).toBeInTheDocument()
    expect(screen.getByDisplayValue("empresa@edit.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("+57 310 0000000")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Cra 10 #50-30")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Medellín")).toBeInTheDocument()
  })

  it("botón Cancelar llama a onCancel", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderCreateForm(vi.fn(), onCancel)

    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

// ─── validación — errores al submit vacío ─────────────────────────────────────

describe("CustomerForm — validación", () => {
  it("muestra errores para campos requeridos al enviar sin completar", async () => {
    const user = userEvent.setup()
    renderCreateForm()

    // Limpiamos los defaults de country (tiene "Colombia" por defecto)
    const countryInput = screen.getByLabelText("País")
    await user.clear(countryInput)

    await user.click(screen.getByRole("button", { name: "Crear cliente" }))

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeInTheDocument()
    })

    expect(screen.getByText("El email es requerido")).toBeInTheDocument()
    expect(screen.getByText("El teléfono es requerido")).toBeInTheDocument()
    expect(screen.getByText("La dirección es requerida")).toBeInTheDocument()
    expect(screen.getByText("La ciudad es requerida")).toBeInTheDocument()
    expect(screen.getByText("El país es requerido")).toBeInTheDocument()
  })

  // Nota: la validación de formato de email ("Email inválido") está cubierta en
  // __tests__/schemas/customers.test.ts. jsdom sanitiza type="email" con valores
  // inválidos a "", lo que produce "El email es requerido" en vez de "Email inválido".
  // Testar el schema directamente es más confiable para esta regla.
})

// ─── submit — modo creación ───────────────────────────────────────────────────

describe("CustomerForm — submit creación", () => {
  it("llama a POST /customers/ con los valores del formulario", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/customers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...existingCustomer, id: 99, name: "Nueva Empresa" },
          { status: 201 },
        )
      }),
    )

    const onSuccess = vi.fn()
    renderCreateForm(onSuccess)

    await user.type(screen.getByLabelText("Nombre"), "Nueva Empresa")
    await user.type(screen.getByLabelText("Email"), "nueva@empresa.com")
    await user.type(screen.getByLabelText("Teléfono"), "600 123 456")
    await user.type(screen.getByLabelText("Dirección"), "Av. Test 1")
    await user.type(screen.getByLabelText("Ciudad"), "Bogotá")
    // country ya tiene "Colombia" por defecto

    await user.click(screen.getByRole("button", { name: "Crear cliente" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    expect(capturedBody).toMatchObject({
      name: "Nueva Empresa",
      email: "nueva@empresa.com",
      customer_type: "COMPANY", // default
      country: "Colombia", // default
    })
  })

  it("tax_id vacío se envía como null en el payload", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/customers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...existingCustomer, id: 100 }, { status: 201 })
      }),
    )

    renderCreateForm()

    await user.type(screen.getByLabelText("Nombre"), "Sin NIT")
    await user.type(screen.getByLabelText("Email"), "sinnit@test.com")
    await user.type(screen.getByLabelText("Teléfono"), "300 000 000")
    await user.type(screen.getByLabelText("Dirección"), "Calle 1")
    await user.type(screen.getByLabelText("Ciudad"), "Cali")

    await user.click(screen.getByRole("button", { name: "Crear cliente" }))

    await waitFor(() =>
      expect(capturedBody).toMatchObject({ tax_id: null }),
    )
  })
})

// ─── submit — modo edición ────────────────────────────────────────────────────

describe("CustomerForm — submit edición", () => {
  it("llama a PATCH /customers/:id/ en modo edición", async () => {
    const user = userEvent.setup()
    let patchedUrl: string | null = null

    server.use(
      http.patch(`${BASE}/customers/5/`, async ({ request }) => {
        patchedUrl = request.url
        return HttpResponse.json({ ...existingCustomer, name: "Empresa Editada v2" })
      }),
    )

    const onSuccess = vi.fn()
    renderEditForm(existingCustomer, onSuccess)

    // Modificar el nombre
    const nameInput = screen.getByDisplayValue("Empresa Editada")
    await user.clear(nameInput)
    await user.type(nameInput, "Empresa Editada v2")

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(patchedUrl).toContain("/customers/5/")
  })
})
