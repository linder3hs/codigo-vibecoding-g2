import { describe, expect, it } from "vitest"
import { z } from "zod"

// ─── routeSchema (idéntico al definido inline en RouteForm.tsx) ────────────────

const routeSchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  origin_warehouse: z.string().min(1, { error: "Selecciona un almacén" }),
  estimated_duration_hours: z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" }),
  estimated_distance_km: z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" }),
})

// ─── stopSchema (idéntico al definido inline en StopForm.tsx) ──────────────────

const stopSchema = z.object({
  stop_order: z.number({ error: "Requerido" }).int({ error: "Debe ser entero" }).min(1, { error: "Mínimo 1" }),
  address: z.string().min(1, { error: "Requerido" }),
  city: z.string().min(1, { error: "Requerido" }),
  estimated_offset_hours: z.number({ error: "Requerido" }).min(0, { error: "Debe ser >= 0" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// ─── helpers ───────────────────────────────────────────────────────────────────

function routeMessages(input: object) {
  const r = routeSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

function stopMessages(input: object) {
  const r = stopSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── routeSchema — fixture válida ─────────────────────────────────────────────

const validRoute = {
  name: "Ruta Bogotá - Medellín",
  origin_warehouse: "3",
  estimated_duration_hours: 8.5,
  estimated_distance_km: 450,
}

// ─── stopSchema — fixture válida ──────────────────────────────────────────────

const validStop = {
  stop_order: 1,
  address: "Calle 10 # 20-30",
  city: "Manizales",
  estimated_offset_hours: 2.5,
}

// ══════════════════════════════════════════════════════════════════════════════
// routeSchema
// ══════════════════════════════════════════════════════════════════════════════

describe("routeSchema — casos válidos", () => {
  it("pasa con todos los campos correctos", () => {
    expect(routeSchema.safeParse(validRoute).success).toBe(true)
  })

  it("pasa con duración y distancia decimales", () => {
    expect(
      routeSchema.safeParse({
        ...validRoute,
        estimated_duration_hours: 12.75,
        estimated_distance_km: 620.5,
      }).success,
    ).toBe(true)
  })

  it("pasa con origin_warehouse como string numérico", () => {
    expect(routeSchema.safeParse({ ...validRoute, origin_warehouse: "10" }).success).toBe(true)
  })
})

// ─── campo name ───────────────────────────────────────────────────────────────

describe("routeSchema — campo name", () => {
  it("falla con string vacío", () => {
    expect(routeSchema.safeParse({ ...validRoute, name: "" }).success).toBe(false)
  })

  it("muestra 'El nombre es requerido' cuando está vacío", () => {
    expect(routeMessages({ ...validRoute, name: "" })).toContain("El nombre es requerido")
  })

  it("falla cuando está ausente", () => {
    const { name: _, ...rest } = validRoute
    expect(routeSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo origin_warehouse ───────────────────────────────────────────────────

describe("routeSchema — campo origin_warehouse", () => {
  it("falla con string vacío", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, origin_warehouse: "" }).success,
    ).toBe(false)
  })

  it("muestra 'Selecciona un almacén' cuando está vacío", () => {
    expect(
      routeMessages({ ...validRoute, origin_warehouse: "" }),
    ).toContain("Selecciona un almacén")
  })

  it("acepta cualquier string no vacío (es string del Select, no number)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, origin_warehouse: "99" }).success,
    ).toBe(true)
  })
})

// ─── campo estimated_duration_hours ──────────────────────────────────────────

describe("routeSchema — campo estimated_duration_hours", () => {
  it("falla con 0 (no es positivo)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_duration_hours: 0 }).success,
    ).toBe(false)
  })

  it("muestra 'Debe ser mayor a 0' cuando vale 0", () => {
    expect(
      routeMessages({ ...validRoute, estimated_duration_hours: 0 }),
    ).toContain("Debe ser mayor a 0")
  })

  it("falla con valor negativo", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_duration_hours: -1 }).success,
    ).toBe(false)
  })

  it("falla con NaN (input vacío / no-number)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_duration_hours: NaN }).success,
    ).toBe(false)
  })

  it("muestra 'Requerido' con NaN", () => {
    const msgs = routeMessages({ ...validRoute, estimated_duration_hours: NaN })
    expect(msgs).toContain("Requerido")
  })

  it("pasa con valor muy pequeño pero positivo (0.01)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_duration_hours: 0.01 }).success,
    ).toBe(true)
  })
})

// ─── campo estimated_distance_km ──────────────────────────────────────────────

describe("routeSchema — campo estimated_distance_km", () => {
  it("falla con 0 (no es positivo)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_distance_km: 0 }).success,
    ).toBe(false)
  })

  it("muestra 'Debe ser mayor a 0' cuando vale 0", () => {
    expect(
      routeMessages({ ...validRoute, estimated_distance_km: 0 }),
    ).toContain("Debe ser mayor a 0")
  })

  it("falla con valor negativo", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_distance_km: -5 }).success,
    ).toBe(false)
  })

  it("falla con NaN (input vacío / no-number)", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_distance_km: NaN }).success,
    ).toBe(false)
  })

  it("pasa con valor decimal positivo", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, estimated_distance_km: 0.5 }).success,
    ).toBe(true)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("routeSchema — múltiples errores", () => {
  it("name vacío y origin_warehouse vacío generan ambos errores", () => {
    const msgs = routeMessages({ ...validRoute, name: "", origin_warehouse: "" })
    expect(msgs).toContain("El nombre es requerido")
    expect(msgs).toContain("Selecciona un almacén")
  })

  it("duración y distancia = 0 generan dos errores 'Debe ser mayor a 0'", () => {
    const msgs = routeMessages({
      ...validRoute,
      estimated_duration_hours: 0,
      estimated_distance_km: 0,
    })
    expect(msgs.filter((m) => m === "Debe ser mayor a 0")).toHaveLength(2)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// stopSchema
// ══════════════════════════════════════════════════════════════════════════════

describe("stopSchema — casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(stopSchema.safeParse(validStop).success).toBe(true)
  })

  it("pasa con stop_order = 1 (mínimo válido)", () => {
    expect(stopSchema.safeParse({ ...validStop, stop_order: 1 }).success).toBe(true)
  })

  it("pasa con estimated_offset_hours = 0 (mínimo válido)", () => {
    expect(stopSchema.safeParse({ ...validStop, estimated_offset_hours: 0 }).success).toBe(true)
  })

  it("pasa sin latitude ni longitude (opcionales)", () => {
    const { ...rest } = validStop
    expect(stopSchema.safeParse(rest).success).toBe(true)
  })

  it("pasa con coordenadas numéricas", () => {
    expect(
      stopSchema.safeParse({
        ...validStop,
        latitude: 4.7109,
        longitude: -74.0721,
      }).success,
    ).toBe(true)
  })
})

// ─── campo stop_order ─────────────────────────────────────────────────────────

describe("stopSchema — campo stop_order", () => {
  it("falla con 0 (no cumple min 1)", () => {
    expect(stopSchema.safeParse({ ...validStop, stop_order: 0 }).success).toBe(false)
  })

  it("muestra 'Mínimo 1' con stop_order = 0", () => {
    expect(stopMessages({ ...validStop, stop_order: 0 })).toContain("Mínimo 1")
  })

  it("falla con valor decimal (no es entero)", () => {
    expect(stopSchema.safeParse({ ...validStop, stop_order: 1.5 }).success).toBe(false)
  })

  it("muestra 'Debe ser entero' con decimal", () => {
    expect(stopMessages({ ...validStop, stop_order: 1.5 })).toContain("Debe ser entero")
  })

  it("falla con valor negativo", () => {
    expect(stopSchema.safeParse({ ...validStop, stop_order: -1 }).success).toBe(false)
  })

  it("pasa con valores enteros mayores que 1", () => {
    expect(stopSchema.safeParse({ ...validStop, stop_order: 5 }).success).toBe(true)
  })
})

// ─── campo address ────────────────────────────────────────────────────────────

describe("stopSchema — campo address", () => {
  it("falla con string vacío", () => {
    expect(stopSchema.safeParse({ ...validStop, address: "" }).success).toBe(false)
  })

  it("muestra 'Requerido' cuando está vacío", () => {
    expect(stopMessages({ ...validStop, address: "" })).toContain("Requerido")
  })
})

// ─── campo city ───────────────────────────────────────────────────────────────

describe("stopSchema — campo city", () => {
  it("falla con string vacío", () => {
    expect(stopSchema.safeParse({ ...validStop, city: "" }).success).toBe(false)
  })

  it("muestra 'Requerido' cuando está vacío", () => {
    expect(stopMessages({ ...validStop, city: "" })).toContain("Requerido")
  })
})

// ─── campo estimated_offset_hours ─────────────────────────────────────────────

describe("stopSchema — campo estimated_offset_hours", () => {
  it("pasa con 0 (mínimo permitido)", () => {
    expect(
      stopSchema.safeParse({ ...validStop, estimated_offset_hours: 0 }).success,
    ).toBe(true)
  })

  it("falla con valor negativo", () => {
    expect(
      stopSchema.safeParse({ ...validStop, estimated_offset_hours: -0.5 }).success,
    ).toBe(false)
  })

  it("muestra 'Debe ser >= 0' con valor negativo", () => {
    expect(
      stopMessages({ ...validStop, estimated_offset_hours: -1 }),
    ).toContain("Debe ser >= 0")
  })

  it("pasa con valores positivos mayores a 0", () => {
    expect(
      stopSchema.safeParse({ ...validStop, estimated_offset_hours: 24 }).success,
    ).toBe(true)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("stopSchema — múltiples errores", () => {
  it("address y city vacíos generan ambos errores 'Requerido'", () => {
    const msgs = stopMessages({ ...validStop, address: "", city: "" })
    expect(msgs.filter((m) => m === "Requerido")).toHaveLength(2)
  })

  it("stop_order=0 y offset=-1 generan errores independientes", () => {
    const msgs = stopMessages({
      ...validStop,
      stop_order: 0,
      estimated_offset_hours: -1,
    })
    expect(msgs).toContain("Mínimo 1")
    expect(msgs).toContain("Debe ser >= 0")
  })
})
