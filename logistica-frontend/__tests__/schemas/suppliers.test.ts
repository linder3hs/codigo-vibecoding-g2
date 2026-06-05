import { describe, expect, it } from "vitest"
import { supplierSchema } from "@/lib/validators/supplier"

// ─── fixture ───────────────────────────────────────────────────────────────────

const valid = {
  name: "Distribuidora Norte",
  contact_name: "Juan Pérez",
  email: "juan@norte.com",
  phone: "+57 300 1111111",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
}

function messages(input: object) {
  const r = supplierSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(supplierSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con tax_id incluido", () => {
    expect(
      supplierSchema.safeParse({ ...valid, tax_id: "800111222-3" }).success,
    ).toBe(true)
  })

  it("pasa sin tax_id (campo opcional)", () => {
    expect(supplierSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con tax_id undefined explícito", () => {
    expect(
      supplierSchema.safeParse({ ...valid, tax_id: undefined }).success,
    ).toBe(true)
  })

  it("pasa con tax_id string vacío (Zod lo acepta como optional string)", () => {
    expect(
      supplierSchema.safeParse({ ...valid, tax_id: "" }).success,
    ).toBe(true)
  })

  it("name de exactamente 200 caracteres pasa", () => {
    expect(
      supplierSchema.safeParse({ ...valid, name: "A".repeat(200) }).success,
    ).toBe(true)
  })
})

// ─── campo name ────────────────────────────────────────────────────────────────

describe("campo name", () => {
  it("falla con string vacío", () => {
    expect(supplierSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("muestra 'El nombre es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, name: "" })).toContain("El nombre es requerido")
  })

  it("falla con más de 200 caracteres", () => {
    expect(
      supplierSchema.safeParse({ ...valid, name: "A".repeat(201) }).success,
    ).toBe(false)
  })

  it("muestra 'Máximo 200 caracteres' cuando excede el límite", () => {
    expect(messages({ ...valid, name: "A".repeat(201) })).toContain(
      "Máximo 200 caracteres",
    )
  })

  it("falla cuando está ausente", () => {
    const { name: _, ...rest } = valid
    expect(supplierSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo contact_name ───────────────────────────────────────────────────────

describe("campo contact_name", () => {
  it("falla con string vacío", () => {
    expect(
      supplierSchema.safeParse({ ...valid, contact_name: "" }).success,
    ).toBe(false)
  })

  it("muestra 'El nombre de contacto es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, contact_name: "" })).toContain(
      "El nombre de contacto es requerido",
    )
  })

  it("falla cuando está ausente", () => {
    const { contact_name: _, ...rest } = valid
    expect(supplierSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo email ──────────────────────────────────────────────────────────────

describe("campo email", () => {
  it("falla con string vacío", () => {
    expect(supplierSchema.safeParse({ ...valid, email: "" }).success).toBe(false)
  })

  it("muestra 'El email es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, email: "" })).toContain("El email es requerido")
  })

  it("falla con formato de email inválido", () => {
    expect(
      supplierSchema.safeParse({ ...valid, email: "no-es-un-email" }).success,
    ).toBe(false)
  })

  it("muestra 'Email inválido' con formato incorrecto", () => {
    expect(messages({ ...valid, email: "no-es-un-email" })).toContain(
      "Email inválido",
    )
  })

  it("pasa con email válido", () => {
    expect(
      supplierSchema.safeParse({ ...valid, email: "proveedor@empresa.co" }).success,
    ).toBe(true)
  })
})

// ─── campos requeridos restantes ──────────────────────────────────────────────

describe("campos requeridos — phone, address, city, country", () => {
  it.each([
    ["phone", "El teléfono es requerido"],
    ["address", "La dirección es requerida"],
    ["city", "La ciudad es requerida"],
    ["country", "El país es requerido"],
  ])("campo '%s' vacío muestra '%s'", (field, msg) => {
    expect(messages({ ...valid, [field]: "" })).toContain(msg)
  })

  it.each(["phone", "address", "city", "country"])("campo '%s' ausente falla", (field) => {
    const data = { ...valid } as Record<string, unknown>
    delete data[field]
    expect(supplierSchema.safeParse(data).success).toBe(false)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("múltiples errores simultáneos", () => {
  it("objeto vacío falla con errores en todos los campos requeridos", () => {
    const r = supplierSchema.safeParse({})
    expect(r.success).toBe(false)
    if (r.success) return
    // name, contact_name, email, phone, address, city, country = 7 campos requeridos
    expect(r.error.issues.length).toBeGreaterThanOrEqual(7)
  })

  it("name y contact_name vacíos generan ambos errores", () => {
    const msgs = messages({ ...valid, name: "", contact_name: "" })
    expect(msgs).toContain("El nombre es requerido")
    expect(msgs).toContain("El nombre de contacto es requerido")
  })

  it("email y phone vacíos generan ambos errores", () => {
    const msgs = messages({ ...valid, email: "", phone: "" })
    expect(msgs).toContain("El email es requerido")
    expect(msgs).toContain("El teléfono es requerido")
  })
})
