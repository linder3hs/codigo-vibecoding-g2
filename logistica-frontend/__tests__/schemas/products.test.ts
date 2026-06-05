import { describe, expect, it } from "vitest"
import { productSchema } from "@/lib/validators/product"

// ─── fixture ───────────────────────────────────────────────────────────────────

// lib/validators/product.ts usa z.coerce.number() — acepta strings numéricos

const valid = {
  name: "Caja corrugada",
  sku: "PROD-001",
  category: "Embalaje",
  supplier: 5,
  warehouse: 3,
  weight_kg: 2.5,
  width_cm: 30,
  height_cm: 20,
  depth_cm: 15,
  unit_price: 9500,
  stock_quantity: 200,
}

function messages(input: object) {
  const r = productSchema.safeParse(input)
  if (r.success) return []
  return r.error.issues.map((i) => i.message)
}

// ─── casos válidos ─────────────────────────────────────────────────────────────

describe("casos válidos", () => {
  it("pasa con todos los campos requeridos", () => {
    expect(productSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con description incluida", () => {
    expect(
      productSchema.safeParse({ ...valid, description: "Caja de cartón" }).success,
    ).toBe(true)
  })

  it("pasa sin description (campo opcional)", () => {
    expect(productSchema.safeParse(valid).success).toBe(true)
  })

  it("pasa con stock_quantity = 0 (límite mínimo permitido)", () => {
    expect(
      productSchema.safeParse({ ...valid, stock_quantity: 0 }).success,
    ).toBe(true)
  })

  it("z.coerce acepta strings numéricos para campos de dimensión", () => {
    expect(
      productSchema.safeParse({
        ...valid,
        weight_kg: "2.5",
        width_cm: "30",
        height_cm: "20",
        depth_cm: "15",
        unit_price: "9500",
      }).success,
    ).toBe(true)
  })

  it("z.coerce acepta string numérico para supplier y warehouse", () => {
    expect(
      productSchema.safeParse({ ...valid, supplier: "5", warehouse: "3" }).success,
    ).toBe(true)
  })
})

// ─── campo name ────────────────────────────────────────────────────────────────

describe("campo name", () => {
  it("falla con string vacío", () => {
    expect(productSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("muestra 'El nombre es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, name: "" })).toContain("El nombre es requerido")
  })

  it("falla cuando está ausente", () => {
    const { name: _, ...rest } = valid
    expect(productSchema.safeParse(rest).success).toBe(false)
  })
})

// ─── campo sku ────────────────────────────────────────────────────────────────

describe("campo sku", () => {
  it("falla con string vacío", () => {
    expect(productSchema.safeParse({ ...valid, sku: "" }).success).toBe(false)
  })

  it("muestra 'El SKU es requerido' cuando está vacío", () => {
    expect(messages({ ...valid, sku: "" })).toContain("El SKU es requerido")
  })
})

// ─── campo category ───────────────────────────────────────────────────────────

describe("campo category", () => {
  it("falla con string vacío", () => {
    expect(productSchema.safeParse({ ...valid, category: "" }).success).toBe(false)
  })

  it("muestra 'La categoría es requerida' cuando está vacío", () => {
    expect(messages({ ...valid, category: "" })).toContain("La categoría es requerida")
  })
})

// ─── campo supplier ───────────────────────────────────────────────────────────

describe("campo supplier", () => {
  it("falla con valor 0", () => {
    expect(productSchema.safeParse({ ...valid, supplier: 0 }).success).toBe(false)
  })

  it("muestra 'Selecciona un proveedor' con valor 0", () => {
    expect(messages({ ...valid, supplier: 0 })).toContain("Selecciona un proveedor")
  })

  it("falla con valor negativo", () => {
    expect(productSchema.safeParse({ ...valid, supplier: -1 }).success).toBe(false)
  })

  it("pasa con id positivo", () => {
    expect(productSchema.safeParse({ ...valid, supplier: 1 }).success).toBe(true)
  })
})

// ─── campo warehouse ──────────────────────────────────────────────────────────

describe("campo warehouse", () => {
  it("falla con valor 0", () => {
    expect(productSchema.safeParse({ ...valid, warehouse: 0 }).success).toBe(false)
  })

  it("muestra 'Selecciona un almacén' con valor 0", () => {
    expect(messages({ ...valid, warehouse: 0 })).toContain("Selecciona un almacén")
  })

  it("falla con valor negativo", () => {
    expect(productSchema.safeParse({ ...valid, warehouse: -1 }).success).toBe(false)
  })
})

// ─── campos de dimensión y precio ────────────────────────────────────────────

describe("campos de dimensión (weight_kg, width_cm, height_cm, depth_cm, unit_price)", () => {
  it.each([
    ["weight_kg", "El peso debe ser mayor a 0"],
    ["width_cm", "El ancho debe ser mayor a 0"],
    ["height_cm", "El alto debe ser mayor a 0"],
    ["depth_cm", "La profundidad debe ser mayor a 0"],
    ["unit_price", "El precio debe ser mayor a 0"],
  ])("campo '%s' con valor 0 muestra '%s'", (field, msg) => {
    expect(messages({ ...valid, [field]: 0 })).toContain(msg)
  })

  it.each(["weight_kg", "width_cm", "height_cm", "depth_cm", "unit_price"])(
    "campo '%s' con valor negativo falla",
    (field) => {
      expect(productSchema.safeParse({ ...valid, [field]: -1 }).success).toBe(false)
    },
  )

  it.each(["weight_kg", "width_cm", "height_cm", "depth_cm", "unit_price"])(
    "campo '%s' con valor positivo pasa",
    (field) => {
      expect(productSchema.safeParse({ ...valid, [field]: 0.1 }).success).toBe(true)
    },
  )
})

// ─── campo stock_quantity ─────────────────────────────────────────────────────

describe("campo stock_quantity", () => {
  it("pasa con valor 0 (mínimo permitido)", () => {
    expect(productSchema.safeParse({ ...valid, stock_quantity: 0 }).success).toBe(true)
  })

  it("pasa con valor positivo", () => {
    expect(productSchema.safeParse({ ...valid, stock_quantity: 500 }).success).toBe(true)
  })

  it("falla con valor negativo", () => {
    expect(productSchema.safeParse({ ...valid, stock_quantity: -1 }).success).toBe(false)
  })

  it("muestra 'El stock no puede ser negativo' con valor negativo", () => {
    expect(messages({ ...valid, stock_quantity: -1 })).toContain(
      "El stock no puede ser negativo",
    )
  })
})

// ─── múltiples errores simultáneos ────────────────────────────────────────────

describe("múltiples errores simultáneos", () => {
  it("objeto vacío genera errores en todos los campos requeridos", () => {
    const r = productSchema.safeParse({})
    expect(r.success).toBe(false)
    if (r.success) return
    // name, sku, category + numéricos obligatorios
    expect(r.error.issues.length).toBeGreaterThanOrEqual(5)
  })

  it("fallo en name y sku generan ambos errores", () => {
    const msgs = messages({ ...valid, name: "", sku: "" })
    expect(msgs).toContain("El nombre es requerido")
    expect(msgs).toContain("El SKU es requerido")
  })

  it("supplier=0 y warehouse=0 generan ambos errores", () => {
    const msgs = messages({ ...valid, supplier: 0, warehouse: 0 })
    expect(msgs).toContain("Selecciona un proveedor")
    expect(msgs).toContain("Selecciona un almacén")
  })
})
