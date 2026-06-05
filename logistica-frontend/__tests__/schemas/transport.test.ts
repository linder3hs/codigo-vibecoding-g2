import { describe, expect, it } from "vitest"
import { transportSchema } from "@/lib/validators/transport"

const CURRENT_YEAR = new Date().getFullYear()

// ─── fixture ───────────────────────────────────────────────────────────────────

const valid = {
  plate_number: "ABC-123",
  transport_type: "TRUCK" as const,
  brand: "Ford",
  model: "Transit",
  year: 2022,
  capacity_kg: 1500,
  capacity_m3: 12.5,
  is_available: true,
}

function messages(input: object) {
  const r = transportSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos correctos", () => {
    expect(transportSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con is_available=false", () => {
    expect(
      transportSchema.safeParse({ ...valid, is_available: false }).success,
    ).toBe(true)
  })

  it("pasa con todos los transport_type válidos", () => {
    for (const type of ["TRUCK", "VAN", "MOTORCYCLE", "CARGO_BIKE"] as const) {
      expect(
        transportSchema.safeParse({ ...valid, transport_type: type }).success,
      ).toBe(true)
    }
  })

  it("pasa con year = año actual", () => {
    expect(
      transportSchema.safeParse({ ...valid, year: CURRENT_YEAR }).success,
    ).toBe(true)
  })

  it("pasa con year = año actual + 1 (límite superior)", () => {
    expect(
      transportSchema.safeParse({ ...valid, year: CURRENT_YEAR + 1 }).success,
    ).toBe(true)
  })

  it("pasa con year = 1990 (límite inferior)", () => {
    expect(
      transportSchema.safeParse({ ...valid, year: 1990 }).success,
    ).toBe(true)
  })

  it("pasa con plate_number de exactamente 20 caracteres", () => {
    expect(
      transportSchema.safeParse({ ...valid, plate_number: "A".repeat(20) }).success,
    ).toBe(true)
  })
})

// ─── campo plate_number ───────────────────────────────────────────────────────

describe("campo plate_number", () => {
  it("falla con string vacío", () => {
    expect(transportSchema.safeParse({ ...valid, plate_number: "" }).success).toBe(false)
  })

  it("muestra 'La placa es requerida' cuando está vacío", () => {
    expect(messages({ ...valid, plate_number: "" })).toContain("La placa es requerida")
  })

  it("falla con más de 20 caracteres", () => {
    expect(
      transportSchema.safeParse({ ...valid, plate_number: "A".repeat(21) }).success,
    ).toBe(false)
  })

  it("muestra 'Máximo 20 caracteres' cuando excede el límite", () => {
    expect(messages({ ...valid, plate_number: "A".repeat(21) })).toContain(
      "Máximo 20 caracteres",
    )
  })
})

// ─── campo transport_type ─────────────────────────────────────────────────────

describe("campo transport_type", () => {
  it("falla con valor fuera del enum", () => {
    expect(
      transportSchema.safeParse({ ...valid, transport_type: "BICYCLE" }).success,
    ).toBe(false)
  })

  it("muestra 'El tipo de transporte es requerido' con valor inválido", () => {
    expect(messages({ ...valid, transport_type: "INVALID" })).toContain(
      "El tipo de transporte es requerido",
    )
  })

  it("falla cuando está ausente", () => {
    const { transport_type: _, ...rest } = valid
    expect(transportSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campos brand y model ─────────────────────────────────────────────────────

describe("campos brand y model", () => {
  it("falla con brand vacío", () => {
    expect(transportSchema.safeParse({ ...valid, brand: "" }).success).toBe(false)
  })

  it("muestra 'La marca es requerida' cuando brand está vacío", () => {
    expect(messages({ ...valid, brand: "" })).toContain("La marca es requerida")
  })

  it("falla con model vacío", () => {
    expect(transportSchema.safeParse({ ...valid, model: "" }).success).toBe(false)
  })

  it("muestra 'El modelo es requerido' cuando model está vacío", () => {
    expect(messages({ ...valid, model: "" })).toContain("El modelo es requerido")
  })
})

// ─── campo year ───────────────────────────────────────────────────────────────

describe("campo year", () => {
  it("falla con year < 1990", () => {
    expect(transportSchema.safeParse({ ...valid, year: 1989 }).success).toBe(false)
  })

  it("muestra 'Año mínimo 1990' con year = 1989", () => {
    expect(messages({ ...valid, year: 1989 })).toContain("Año mínimo 1990")
  })

  it("falla con year > año actual + 1", () => {
    expect(
      transportSchema.safeParse({ ...valid, year: CURRENT_YEAR + 2 }).success,
    ).toBe(false)
  })

  it("muestra 'Año inválido' con year excesivo", () => {
    expect(messages({ ...valid, year: CURRENT_YEAR + 2 })).toContain("Año inválido")
  })

  it("falla cuando el valor no es número", () => {
    expect(
      transportSchema.safeParse({ ...valid, year: "dos mil veinte" }).success,
    ).toBe(false)
  })

  it("muestra 'El año debe ser un número' con valor no numérico", () => {
    expect(messages({ ...valid, year: "abc" })).toContain("El año debe ser un número")
  })

  it("falla con año decimal (debe ser entero)", () => {
    expect(transportSchema.safeParse({ ...valid, year: 2022.5 }).success).toBe(false)
  })
})

// ─── campos capacity_kg y capacity_m3 ────────────────────────────────────────

describe("campos capacity_kg y capacity_m3", () => {
  it.each([
    ["capacity_kg", "La capacidad debe ser mayor a 0"],
    ["capacity_m3", "La capacidad debe ser mayor a 0"],
  ])("campo '%s' con valor 0 muestra '%s'", (field, msg) => {
    expect(messages({ ...valid, [field]: 0 })).toContain(msg)
  })

  it.each(["capacity_kg", "capacity_m3"])(
    "campo '%s' con valor negativo falla",
    (field) => {
      expect(transportSchema.safeParse({ ...valid, [field]: -1 }).success).toBe(false)
    },
  )

  it.each(["capacity_kg", "capacity_m3"])(
    "campo '%s' con valor positivo pasa",
    (field) => {
      expect(transportSchema.safeParse({ ...valid, [field]: 0.5 }).success).toBe(true)
    },
  )

  it("muestra 'La capacidad debe ser un número' con valor no numérico", () => {
    expect(messages({ ...valid, capacity_kg: "cien" })).toContain(
      "La capacidad debe ser un número",
    )
  })
})

// ─── campo is_available ───────────────────────────────────────────────────────

describe("campo is_available", () => {
  it("pasa con true", () => {
    expect(transportSchema.safeParse({ ...valid, is_available: true }).success).toBe(true)
  })

  it("pasa con false", () => {
    expect(transportSchema.safeParse({ ...valid, is_available: false }).success).toBe(true)
  })

  it("falla con string 'true'", () => {
    expect(
      transportSchema.safeParse({ ...valid, is_available: "true" }).success,
    ).toBe(false)
  })

  it("falla cuando está ausente", () => {
    const { is_available: _, ...rest } = valid
    expect(transportSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("múltiples errores simultáneos", () => {
  it("plate_number y brand vacíos generan ambos errores", () => {
    const msgs = messages({ ...valid, plate_number: "", brand: "" })
    expect(msgs).toContain("La placa es requerida")
    expect(msgs).toContain("La marca es requerida")
  })

  it("capacity_kg=0 y capacity_m3=0 generan ambos errores", () => {
    const msgs = messages({ ...valid, capacity_kg: 0, capacity_m3: 0 })
    expect(msgs.filter((m) => m === "La capacidad debe ser mayor a 0")).toHaveLength(2)
  })
})
