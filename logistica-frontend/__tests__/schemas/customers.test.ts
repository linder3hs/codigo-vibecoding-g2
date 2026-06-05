import { describe, expect, it } from "vitest"
import { customerSchema } from "@/lib/validators/customer"

// ─── fixture ───────────────────────────────────────────────────────────────────

const valid = {
  name: "Acme Corp",
  customer_type: "COMPANY" as const,
  email: "acme@example.com",
  phone: "+57 300 0000001",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
}

function messages(input: object) {
  const result = customerSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(customerSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con customer_type INDIVIDUAL", () => {
    expect(
      customerSchema.safeParse({ ...valid, customer_type: "INDIVIDUAL" }).success,
    ).toBe(true)
  })

  it("pasa sin tax_id (campo opcional)", () => {
    const { ...rest } = valid
    expect(customerSchema.safeParse(rest).success).toBe(true)
  })

  it("pasa con tax_id vacío", () => {
    expect(customerSchema.safeParse({ ...valid, tax_id: "" }).success).toBe(true)
  })

  it("pasa con tax_id con valor", () => {
    expect(
      customerSchema.safeParse({ ...valid, tax_id: "900123456-1" }).success,
    ).toBe(true)
  })

  it("name de exactamente 200 caracteres pasa", () => {
    expect(
      customerSchema.safeParse({ ...valid, name: "A".repeat(200) }).success,
    ).toBe(true)
  })
})

// ─── campo name ────────────────────────────────────────────────────────────────

describe("campo name", () => {
  it("falla con string vacío", () => {
    expect(customerSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("muestra 'El nombre es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, name: "" })).toContain("El nombre es requerido")
  })

  it("falla cuando supera 200 caracteres", () => {
    expect(
      customerSchema.safeParse({ ...valid, name: "A".repeat(201) }).success,
    ).toBe(false)
  })

  it("muestra 'Máximo 200 caracteres' cuando supera el límite", () => {
    expect(messages({ ...valid, name: "A".repeat(201) })).toContain(
      "Máximo 200 caracteres",
    )
  })
})

// ─── campo customer_type ───────────────────────────────────────────────────────

describe("campo customer_type", () => {
  it("falla con valor no permitido", () => {
    expect(
      customerSchema.safeParse({ ...valid, customer_type: "CORPORATION" }).success,
    ).toBe(false)
  })

  it("falla cuando está ausente", () => {
    const { customer_type: _, ...rest } = valid
    expect(customerSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo email ──────────────────────────────────────────────────────────────

describe("campo email", () => {
  it("falla con string vacío", () => {
    expect(customerSchema.safeParse({ ...valid, email: "" }).success).toBe(false)
  })

  it("muestra 'El email es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, email: "" })).toContain("El email es requerido")
  })

  it("falla con formato inválido", () => {
    expect(
      customerSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false)
  })

  it("muestra 'Email inválido' con formato incorrecto", () => {
    expect(messages({ ...valid, email: "badformat" })).toContain("Email inválido")
  })
})

// ─── campos requeridos restantes ──────────────────────────────────────────────

describe("campos requeridos — phone, address, city, country", () => {
  it.each([
    ["phone", "El teléfono es requerido"],
    ["address", "La dirección es requerida"],
    ["city", "La ciudad es requerida"],
    ["country", "El país es requerido"],
  ])("campo '%s' vacío muestra '%s'", (field, expectedMsg) => {
    const result = messages({ ...valid, [field]: "" })
    expect(result).toContain(expectedMsg)
  })

  it.each(["phone", "address", "city", "country"])(
    "campo '%s' ausente falla",
    (field) => {
      const data = { ...valid } as Record<string, unknown>
      delete data[field]
      expect(customerSchema.safeParse(data).success).toBe(false)
    },
  )
})

// ─── múltiples errores ────────────────────────────────────────────────────────

describe("múltiples errores simultáneos", () => {
  it("objeto vacío falla con errores en todos los campos requeridos", () => {
    const result = customerSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.length).toBeGreaterThanOrEqual(7)
  })
})
