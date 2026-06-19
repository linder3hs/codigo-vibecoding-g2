import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getProductColumns } from "@/lib/columns/product-columns"
import type { Product } from "@/types/product"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseProduct: Product = {
  id: 7,
  name: "Caja corrugada",
  sku: "PROD-001",
  category: "Embalaje",
  supplier: 5,
  warehouse: 3,
  weight_kg: "2.50",
  width_cm: "30.00",
  height_cm: "20.00",
  depth_cm: "15.00",
  unit_price: "9500.00",
  stock_quantity: 200,
  description: "Caja de cartón corrugado",
  image_url: null,
  is_active: true,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Product> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: {
    row: { original: Product; getValue: (key: string) => unknown }
  }) => React.ReactNode
}

function findCol(cols: ColumnDef<Product>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Product> = {}) {
  const p = { ...baseProduct, ...overrides }
  return {
    original: p,
    getValue: (key: string) => p[key as keyof Product],
  }
}

function renderCell(col: AnyColDef, overrides: Partial<Product> = {}) {
  const node = col.cell!({ row: makeRow(overrides) })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene todas las columnas esperadas", () => {
    const cols = getProductColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining([
        "image", "name", "sku", "category", "supplier", "warehouse",
        "unit_price", "stock_quantity", "actions",
      ]),
    )
  })

  it("tiene exactamente 9 columnas con permisos por defecto", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(9)
  })
})

// ─── columna supplier ─────────────────────────────────────────────────────────

describe("columna supplier", () => {
  it("muestra el id del proveedor con prefijo #", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "supplier")
    renderCell(col)

    expect(screen.getByText("#5")).toBeInTheDocument()
  })

  it("muestra el id correcto para otro proveedor", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "supplier")
    renderCell(col, { supplier: 12 })

    expect(screen.getByText("#12")).toBeInTheDocument()
  })
})

// ─── columna warehouse ────────────────────────────────────────────────────────

describe("columna warehouse", () => {
  it("muestra el id del almacén con prefijo #", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "warehouse")
    renderCell(col)

    expect(screen.getByText("#3")).toBeInTheDocument()
  })

  it("muestra el id correcto para otro almacén", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "warehouse")
    renderCell(col, { warehouse: 8 })

    expect(screen.getByText("#8")).toBeInTheDocument()
  })
})

// ─── columna unit_price ───────────────────────────────────────────────────────

describe("columna unit_price", () => {
  it("formatea '9500.00' con signo $ y formato localizado", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "unit_price")
    renderCell(col)

    // Acepta separador de miles con punto o coma según ICU del entorno
    expect(screen.getByText(/\$9[.,]?500/)).toBeInTheDocument()
  })

  it("formatea '1200.50' correctamente", () => {
    const cols = getProductColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "unit_price")
    renderCell(col, { unit_price: "1200.50" })

    expect(screen.getByText(/\$1[.,]?200/)).toBeInTheDocument()
  })

  it("el valor raw llega como string desde la API y se parsea a float", () => {
    expect(parseFloat("9500.00")).toBe(9500)
    expect(parseFloat("1200.50")).toBe(1200.5)
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el producto", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getProductColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el producto", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getProductColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false solo hay botón de eliminar", () => {
    const cols = getProductColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón de editar", () => {
    const cols = getProductColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getProductColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })

  it("sin actions hay exactamente 8 columnas", () => {
    const cols = getProductColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    })
    expect(cols).toHaveLength(8)
  })
})
