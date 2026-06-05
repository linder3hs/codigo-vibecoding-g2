import { describe, expect, it } from "vitest"
import { z } from "zod"

// ─── shipmentSchema (idéntico al definido inline en ShipmentForm.tsx) ──────────

const shipmentSchema = z.object({
  customer: z.string().min(1, { error: "Selecciona un cliente" }),
  origin_warehouse: z.string().min(1, { error: "Selecciona un almacén de origen" }),
  destination_address: z.string().min(1, { error: "La dirección de destino es requerida" }),
  destination_city: z.string().min(1, { error: "La ciudad de destino es requerida" }),
  destination_country: z.string().min(1, { error: "El país de destino es requerido" }),
  status: z.string().min(1, { error: "Selecciona un estado" }),
  estimated_delivery_date: z.string().optional(),
  driver: z.string().optional(),
  transport: z.string().optional(),
  route: z.string().optional(),
  notes: z.string().optional(),
})

// ─── itemSchema (idéntico al definido inline en ItemForm.tsx) ──────────────────

const itemSchema = z.object({
  product: z.string().min(1, { error: "Selecciona un producto" }),
  quantity: z.number({ error: "La cantidad es requerida" }).int().min(1, "Mínimo 1"),
  unit_price_at_time: z.number({ error: "El precio unitario es requerido" }).positive("Debe ser mayor a 0"),
})

// ─── helpers ───────────────────────────────────────────────────────────────────

function shipmentMessages(input: object) {
  const r = shipmentSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

function itemMessages(input: object) {
  const r = itemSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── shipmentSchema — fixture válida ──────────────────────────────────────────

const validShipment = {
  customer: "5",
  origin_warehouse: "3",
  destination_address: "Calle 10 # 20-30",
  destination_city: "Medellín",
  destination_country: "Colombia",
  status: "PENDING",
}

// ─── itemSchema — fixture válida ──────────────────────────────────────────────

const validItem = {
  product: "7",
  quantity: 2,
  unit_price_at_time: 25000,
}

// ══════════════════════════════════════════════════════════════════════════════
// shipmentSchema
// ══════════════════════════════════════════════════════════════════════════════

describe("shipmentSchema — casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(shipmentSchema.safeParse(validShipment).success).toBe(true)
  })

  it("pasa con todos los campos opcionales vacíos (default del form)", () => {
    expect(
      shipmentSchema.safeParse({
        ...validShipment,
        estimated_delivery_date: "",
        driver: "__none__",
        transport: "__none__",
        route: "__none__",
        notes: "",
      }).success,
    ).toBe(true)
  })

  it("pasa con status = 'PENDING' (default del form)", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, status: "PENDING" }).success).toBe(true)
  })

  it("pasa con destination_country = 'Colombia' (default del form)", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, destination_country: "Colombia" }).success).toBe(true)
  })

  it("pasa con todos los statuses válidos", () => {
    const statuses = ["PENDING", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RETURNED"]
    for (const s of statuses) {
      expect(shipmentSchema.safeParse({ ...validShipment, status: s }).success).toBe(true)
    }
  })
})

// ─── campo customer ───────────────────────────────────────────────────────────

describe("shipmentSchema — campo customer", () => {
  it("falla con string vacío", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, customer: "" }).success).toBe(false)
  })

  it("muestra 'Selecciona un cliente' cuando está vacío", () => {
    expect(shipmentMessages({ ...validShipment, customer: "" })).toContain("Selecciona un cliente")
  })

  it("pasa con cualquier string no vacío (id como string del Select)", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, customer: "99" }).success).toBe(true)
  })
})

// ─── campo origin_warehouse ───────────────────────────────────────────────────

describe("shipmentSchema — campo origin_warehouse", () => {
  it("falla con string vacío", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, origin_warehouse: "" }).success).toBe(false)
  })

  it("muestra 'Selecciona un almacén de origen' cuando está vacío", () => {
    expect(shipmentMessages({ ...validShipment, origin_warehouse: "" })).toContain(
      "Selecciona un almacén de origen",
    )
  })
})

// ─── campos de dirección ──────────────────────────────────────────────────────

describe("shipmentSchema — campos de dirección", () => {
  it("destination_address vacío genera error", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, destination_address: "" }).success).toBe(false)
  })

  it("muestra 'La dirección de destino es requerida'", () => {
    expect(shipmentMessages({ ...validShipment, destination_address: "" })).toContain(
      "La dirección de destino es requerida",
    )
  })

  it("destination_city vacío genera error", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, destination_city: "" }).success).toBe(false)
  })

  it("muestra 'La ciudad de destino es requerida'", () => {
    expect(shipmentMessages({ ...validShipment, destination_city: "" })).toContain(
      "La ciudad de destino es requerida",
    )
  })

  it("destination_country vacío genera error", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, destination_country: "" }).success).toBe(false)
  })

  it("muestra 'El país de destino es requerido'", () => {
    expect(shipmentMessages({ ...validShipment, destination_country: "" })).toContain(
      "El país de destino es requerido",
    )
  })
})

// ─── campo status ─────────────────────────────────────────────────────────────

describe("shipmentSchema — campo status", () => {
  it("falla con string vacío", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, status: "" }).success).toBe(false)
  })

  it("muestra 'Selecciona un estado' cuando está vacío", () => {
    expect(shipmentMessages({ ...validShipment, status: "" })).toContain("Selecciona un estado")
  })
})

// ─── campos opcionales ────────────────────────────────────────────────────────

describe("shipmentSchema — campos opcionales", () => {
  it("estimated_delivery_date undefined pasa (optional)", () => {
    const { estimated_delivery_date: _, ...rest } = { ...validShipment, estimated_delivery_date: undefined }
    expect(shipmentSchema.safeParse(rest).success).toBe(true)
  })

  it("driver '__none__' pasa (string opcional)", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, driver: "__none__" }).success).toBe(true)
  })

  it("notes string vacío pasa (opcional)", () => {
    expect(shipmentSchema.safeParse({ ...validShipment, notes: "" }).success).toBe(true)
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("shipmentSchema — múltiples errores", () => {
  it("customer, origin_warehouse y destination_address vacíos generan 3 errores", () => {
    const msgs = shipmentMessages({
      ...validShipment,
      customer: "",
      origin_warehouse: "",
      destination_address: "",
    })
    expect(msgs).toContain("Selecciona un cliente")
    expect(msgs).toContain("Selecciona un almacén de origen")
    expect(msgs).toContain("La dirección de destino es requerida")
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// itemSchema
// ══════════════════════════════════════════════════════════════════════════════

describe("itemSchema — casos válidos", () => {
  it("pasa con todos los campos correctos", () => {
    expect(itemSchema.safeParse(validItem).success).toBe(true)
  })

  it("pasa con quantity = 1 (mínimo)", () => {
    expect(itemSchema.safeParse({ ...validItem, quantity: 1 }).success).toBe(true)
  })

  it("pasa con unit_price_at_time muy pequeño pero positivo", () => {
    expect(itemSchema.safeParse({ ...validItem, unit_price_at_time: 0.01 }).success).toBe(true)
  })
})

// ─── campo product ────────────────────────────────────────────────────────────

describe("itemSchema — campo product", () => {
  it("falla con string vacío", () => {
    expect(itemSchema.safeParse({ ...validItem, product: "" }).success).toBe(false)
  })

  it("muestra 'Selecciona un producto' cuando está vacío", () => {
    expect(itemMessages({ ...validItem, product: "" })).toContain("Selecciona un producto")
  })

  it("pasa con string numérico no vacío", () => {
    expect(itemSchema.safeParse({ ...validItem, product: "7" }).success).toBe(true)
  })
})

// ─── campo quantity ───────────────────────────────────────────────────────────

describe("itemSchema — campo quantity", () => {
  it("falla con 0 (no cumple min 1)", () => {
    expect(itemSchema.safeParse({ ...validItem, quantity: 0 }).success).toBe(false)
  })

  it("muestra 'Mínimo 1' cuando quantity = 0", () => {
    expect(itemMessages({ ...validItem, quantity: 0 })).toContain("Mínimo 1")
  })

  it("falla con valor decimal", () => {
    expect(itemSchema.safeParse({ ...validItem, quantity: 1.5 }).success).toBe(false)
  })

  it("falla con NaN (input vacío)", () => {
    expect(itemSchema.safeParse({ ...validItem, quantity: NaN }).success).toBe(false)
  })

  it("muestra 'La cantidad es requerida' con NaN", () => {
    expect(itemMessages({ ...validItem, quantity: NaN })).toContain("La cantidad es requerida")
  })

  it("pasa con valores mayores a 1", () => {
    expect(itemSchema.safeParse({ ...validItem, quantity: 100 }).success).toBe(true)
  })
})

// ─── campo unit_price_at_time ─────────────────────────────────────────────────

describe("itemSchema — campo unit_price_at_time", () => {
  it("falla con 0 (no es positivo)", () => {
    expect(itemSchema.safeParse({ ...validItem, unit_price_at_time: 0 }).success).toBe(false)
  })

  it("muestra 'Debe ser mayor a 0' cuando vale 0", () => {
    expect(itemMessages({ ...validItem, unit_price_at_time: 0 })).toContain("Debe ser mayor a 0")
  })

  it("falla con valor negativo", () => {
    expect(itemSchema.safeParse({ ...validItem, unit_price_at_time: -100 }).success).toBe(false)
  })

  it("falla con NaN", () => {
    expect(itemSchema.safeParse({ ...validItem, unit_price_at_time: NaN }).success).toBe(false)
  })

  it("muestra 'El precio unitario es requerido' con NaN", () => {
    expect(itemMessages({ ...validItem, unit_price_at_time: NaN })).toContain(
      "El precio unitario es requerido",
    )
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("itemSchema — múltiples errores", () => {
  it("product vacío, quantity=0 y price=0 generan 3 errores", () => {
    const msgs = itemMessages({ product: "", quantity: 0, unit_price_at_time: 0 })
    expect(msgs).toContain("Selecciona un producto")
    expect(msgs).toContain("Mínimo 1")
    expect(msgs).toContain("Debe ser mayor a 0")
  })
})
