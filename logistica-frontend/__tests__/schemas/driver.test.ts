import { describe, expect, it } from "vitest"
import { z } from "zod"

// ─── schema (idéntico al definido en DriverForm.tsx, sin exportar) ────────────

const driverSchema = z.object({
  user: z.number({ error: "El ID del usuario es requerido" }).int().positive(),
  license_number: z.string().min(1, { error: "El número de licencia es requerido" }),
  license_expiry: z
    .string()
    .min(1, { error: "La fecha de vencimiento es requerida" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato requerido: YYYY-MM-DD"),
  phone: z.string().min(1, { error: "El teléfono es requerido" }),
  transport: z.number().int().positive().nullable().optional(),
  is_active: z.boolean(),
})

// ─── fixture ───────────────────────────────────────────────────────────────────

const valid = {
  user: 8,
  license_number: "LIC-001234",
  license_expiry: "2027-06-30",
  phone: "+57 310 000 0000",
  transport: 2,
  is_active: true,
}

function messages(input: object) {
  const r = driverSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos correctos", () => {
    expect(driverSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con transport=null (sin transporte asignado)", () => {
    expect(driverSchema.safeParse({ ...valid, transport: null }).success).toBe(true)
  })

  it("pasa sin transport (campo opcional/undefined)", () => {
    const { transport: _, ...rest } = valid
    expect(driverSchema.safeParse(rest).success).toBe(true)
  })

  it("pasa con is_active=false", () => {
    expect(driverSchema.safeParse({ ...valid, is_active: false }).success).toBe(true)
  })

  it("pasa con license_expiry en formato correcto YYYY-MM-DD", () => {
    const dates = ["2027-01-01", "2030-12-31", "2026-02-28"]
    for (const d of dates) {
      expect(driverSchema.safeParse({ ...valid, license_expiry: d }).success).toBe(true)
    }
  })
})

// ─── campo user ───────────────────────────────────────────────────────────────

describe("campo user", () => {
  it("falla con user = 0 (no es positivo)", () => {
    expect(driverSchema.safeParse({ ...valid, user: 0 }).success).toBe(false)
  })

  it("falla con user negativo", () => {
    expect(driverSchema.safeParse({ ...valid, user: -1 }).success).toBe(false)
  })

  it("falla con user decimal", () => {
    expect(driverSchema.safeParse({ ...valid, user: 3.5 }).success).toBe(false)
  })

  it("muestra 'El ID del usuario es requerido' cuando el valor no es número", () => {
    expect(messages({ ...valid, user: "abc" })).toContain(
      "El ID del usuario es requerido",
    )
  })

  it("pasa con user positivo entero", () => {
    expect(driverSchema.safeParse({ ...valid, user: 1 }).success).toBe(true)
  })
})

// ─── campo license_number ─────────────────────────────────────────────────────

describe("campo license_number", () => {
  it("falla con string vacío", () => {
    expect(driverSchema.safeParse({ ...valid, license_number: "" }).success).toBe(false)
  })

  it("muestra 'El número de licencia es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, license_number: "" })).toContain(
      "El número de licencia es requerido",
    )
  })

  it("falla cuando está ausente", () => {
    const { license_number: _, ...rest } = valid
    expect(driverSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo license_expiry ─────────────────────────────────────────────────────

describe("campo license_expiry", () => {
  it("falla con string vacío", () => {
    expect(driverSchema.safeParse({ ...valid, license_expiry: "" }).success).toBe(false)
  })

  it("muestra 'La fecha de vencimiento es requerida' cuando está vacío", () => {
    expect(messages({ ...valid, license_expiry: "" })).toContain(
      "La fecha de vencimiento es requerida",
    )
  })

  it("falla con formato incorrecto DD/MM/YYYY", () => {
    expect(
      driverSchema.safeParse({ ...valid, license_expiry: "30/06/2027" }).success,
    ).toBe(false)
  })

  it("falla con formato incorrecto MM-DD-YYYY", () => {
    expect(
      driverSchema.safeParse({ ...valid, license_expiry: "06-30-2027" }).success,
    ).toBe(false)
  })

  it("muestra 'Formato requerido: YYYY-MM-DD' con formato incorrecto", () => {
    expect(messages({ ...valid, license_expiry: "30/06/2027" })).toContain(
      "Formato requerido: YYYY-MM-DD",
    )
  })

  it("falla con fecha sin separadores", () => {
    expect(
      driverSchema.safeParse({ ...valid, license_expiry: "20270630" }).success,
    ).toBe(false)
  })
})

// ─── campo phone ──────────────────────────────────────────────────────────────

describe("campo phone", () => {
  it("falla con string vacío", () => {
    expect(driverSchema.safeParse({ ...valid, phone: "" }).success).toBe(false)
  })

  it("muestra 'El teléfono es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, phone: "" })).toContain("El teléfono es requerido")
  })

  it("falla cuando está ausente", () => {
    const { phone: _, ...rest } = valid
    expect(driverSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo transport ──────────────────────────────────────────────────────────

describe("campo transport", () => {
  it("pasa con null", () => {
    expect(driverSchema.safeParse({ ...valid, transport: null }).success).toBe(true)
  })

  it("pasa con id positivo", () => {
    expect(driverSchema.safeParse({ ...valid, transport: 5 }).success).toBe(true)
  })

  it("pasa sin el campo (undefined)", () => {
    const { transport: _, ...rest } = valid
    expect(driverSchema.safeParse(rest).success).toBe(true)
  })

  it("falla con valor 0 (no es positivo)", () => {
    expect(driverSchema.safeParse({ ...valid, transport: 0 }).success).toBe(false)
  })

  it("falla con valor negativo", () => {
    expect(driverSchema.safeParse({ ...valid, transport: -1 }).success).toBe(false)
  })
})

// ─── campo is_active ──────────────────────────────────────────────────────────

describe("campo is_active", () => {
  it("pasa con true", () => {
    expect(driverSchema.safeParse({ ...valid, is_active: true }).success).toBe(true)
  })

  it("pasa con false", () => {
    expect(driverSchema.safeParse({ ...valid, is_active: false }).success).toBe(true)
  })

  it("falla cuando está ausente", () => {
    const { is_active: _, ...rest } = valid
    expect(driverSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("múltiples errores simultáneos", () => {
  it("license_number y phone vacíos generan ambos errores", () => {
    const msgs = messages({ ...valid, license_number: "", phone: "" })
    expect(msgs).toContain("El número de licencia es requerido")
    expect(msgs).toContain("El teléfono es requerido")
  })

  it("license_expiry vacío y formato inválido reportan el mensaje de requerido primero", () => {
    const msgs = messages({ ...valid, license_expiry: "" })
    expect(msgs).toContain("La fecha de vencimiento es requerida")
  })
})
