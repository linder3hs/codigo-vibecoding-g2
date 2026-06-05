import { describe, expect, it } from "vitest"
import { warehouseSchema } from "@/lib/validators/warehouse"

// ─── fixture ───────────────────────────────────────────────────────────────────

const valid = {
  name: "CEDI Bogotá",
  address: "Zona Franca, Bodega 5",
  city: "Bogotá",
  country: "Colombia",
  capacity_m3: 5000,
}

function messages(input: object) {
  const r = warehouseSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(warehouseSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con lat/long válidos", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: 4.711, longitude: -74.07 }).success,
    ).toBe(true)
  })

  it("pasa sin lat/long (campos opcionales)", () => {
    const { ...rest } = valid
    expect(warehouseSchema.safeParse(rest).success).toBe(true)
  })

  it("pasa con lat/long null", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: null, longitude: null }).success,
    ).toBe(true)
  })

  it("pasa con capacity_m3 decimal positivo", () => {
    expect(warehouseSchema.safeParse({ ...valid, capacity_m3: 1500.75 }).success).toBe(true)
  })

  it("name de exactamente 200 caracteres pasa", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, name: "A".repeat(200) }).success,
    ).toBe(true)
  })

  it("lat/long en el límite exacto pasan (±90, ±180)", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: 90, longitude: 180 }).success,
    ).toBe(true)
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: -90, longitude: -180 }).success,
    ).toBe(true)
  })
})

// ─── campo name ────────────────────────────────────────────────────────────────

describe("campo name", () => {
  it("falla con string vacío", () => {
    expect(warehouseSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("muestra 'El nombre es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, name: "" })).toContain("El nombre es requerido")
  })

  it("falla con más de 200 caracteres", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, name: "A".repeat(201) }).success,
    ).toBe(false)
  })

  it("muestra 'Máximo 200 caracteres' cuando excede el límite", () => {
    expect(messages({ ...valid, name: "A".repeat(201) })).toContain("Máximo 200 caracteres")
  })
})

// ─── campo capacity_m3 ────────────────────────────────────────────────────────

describe("campo capacity_m3", () => {
  it("falla cuando está ausente", () => {
    const { capacity_m3: _, ...rest } = valid
    expect(warehouseSchema.safeParse(rest).success).toBe(false)
  })

  it("falla con valor 0 (debe ser positivo)", () => {
    expect(warehouseSchema.safeParse({ ...valid, capacity_m3: 0 }).success).toBe(false)
  })

  it("muestra 'La capacidad debe ser mayor a 0' con valor 0", () => {
    expect(messages({ ...valid, capacity_m3: 0 })).toContain(
      "La capacidad debe ser mayor a 0",
    )
  })

  it("falla con valor negativo", () => {
    expect(warehouseSchema.safeParse({ ...valid, capacity_m3: -100 }).success).toBe(false)
  })

  it("falla cuando el valor es un string (no número)", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, capacity_m3: "5000" }).success,
    ).toBe(false)
  })

  it("muestra 'Debe ser un número' cuando el valor no es número", () => {
    expect(messages({ ...valid, capacity_m3: "abc" })).toContain("Debe ser un número")
  })
})

// ─── campo latitude ────────────────────────────────────────────────────────────

describe("campo latitude", () => {
  it("falla con valor > 90", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: 91 }).success,
    ).toBe(false)
  })

  it("muestra 'Latitud máxima: 90' cuando excede el límite", () => {
    expect(messages({ ...valid, latitude: 91 })).toContain("Latitud máxima: 90")
  })

  it("falla con valor < -90", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: -91 }).success,
    ).toBe(false)
  })

  it("muestra 'Latitud mínima: -90' cuando está por debajo del límite", () => {
    expect(messages({ ...valid, latitude: -91 })).toContain("Latitud mínima: -90")
  })

  it("falla cuando el valor no es número", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, latitude: "4.711" }).success,
    ).toBe(false)
  })
})

// ─── campo longitude ───────────────────────────────────────────────────────────

describe("campo longitude", () => {
  it("falla con valor > 180", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, longitude: 181 }).success,
    ).toBe(false)
  })

  it("muestra 'Longitud máxima: 180' cuando excede el límite", () => {
    expect(messages({ ...valid, longitude: 181 })).toContain("Longitud máxima: 180")
  })

  it("falla con valor < -180", () => {
    expect(
      warehouseSchema.safeParse({ ...valid, longitude: -181 }).success,
    ).toBe(false)
  })

  it("muestra 'Longitud mínima: -180' cuando está por debajo del límite", () => {
    expect(messages({ ...valid, longitude: -181 })).toContain("Longitud mínima: -180")
  })
})

// ─── campos requeridos restantes ──────────────────────────────────────────────

describe("campos requeridos — address, city, country", () => {
  it.each([
    ["address", "La dirección es requerida"],
    ["city", "La ciudad es requerida"],
    ["country", "El país es requerido"],
  ])("campo '%s' vacío muestra '%s'", (field, msg) => {
    expect(messages({ ...valid, [field]: "" })).toContain(msg)
  })

  it.each(["address", "city", "country"])("campo '%s' ausente falla", (field) => {
    const data = { ...valid } as Record<string, unknown>
    delete data[field]
    expect(warehouseSchema.safeParse(data).success).toBe(false)
  })
})

// ─── objeto vacío ─────────────────────────────────────────────────────────────

describe("objeto vacío", () => {
  it("falla con errores en todos los campos requeridos", () => {
    const r = warehouseSchema.safeParse({})
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.issues.length).toBeGreaterThanOrEqual(5)
  })
})
