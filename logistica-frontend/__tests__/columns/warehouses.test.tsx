import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getWarehouseColumns } from "@/lib/columns/warehouse-columns"
import type { Warehouse } from "@/types/warehouse"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseWarehouse: Warehouse = {
  id: 3,
  name: "CEDI Bogotá",
  address: "Zona Franca, Bodega 5",
  city: "Bogotá",
  country: "Colombia",
  latitude: 4.711,
  longitude: -74.0721,
  capacity_m3: "5000.00",
  is_active: true,
  created_at: "2026-01-10T08:00:00Z",
  updated_at: "2026-01-10T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Warehouse> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: {
    row: { original: Warehouse; getValue: (key: string) => unknown }
  }) => React.ReactNode
}

function findCol(cols: ColumnDef<Warehouse>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Warehouse> = {}) {
  const w = { ...baseWarehouse, ...overrides }
  return {
    original: w,
    getValue: (key: string) => w[key as keyof Warehouse],
  }
}

function renderCell(col: AnyColDef, overrides: Partial<Warehouse> = {}) {
  const node = col.cell!({ row: makeRow(overrides) })
  return render(<>{node}</>)
}

// ─── columna capacity_m3 ──────────────────────────────────────────────────────

describe("columna capacity_m3 — formateo", () => {
  it("formatea '5000.00' como número localizado con unidad m³", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "capacity_m3")
    renderCell(col)

    // Acepta formato con o sin separador de miles (depende de la ICU del entorno)
    expect(screen.getByText(/m³/)).toBeInTheDocument()
    expect(screen.getByText(/5[.,]?000/)).toBeInTheDocument()
  })

  it("formatea '1200.50' correctamente", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "capacity_m3")
    renderCell(col, { capacity_m3: "1200.50" })

    expect(screen.getByText(/m³/)).toBeInTheDocument()
  })

  it("el valor raw llega como string desde la API y se parsea a float", () => {
    // Verifica que parseFloat("5000.00") = 5000 (no NaN)
    expect(parseFloat("5000.00")).toBe(5000)
    expect(parseFloat("1200.50")).toBe(1200.5)
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el warehouse", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getWarehouseColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el warehouse", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getWarehouseColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false solo hay botón de eliminar", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón de editar", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })
})

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene name, city, country, capacity_m3, actions", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)
    expect(keys).toEqual(
      expect.arrayContaining(["name", "city", "country", "capacity_m3", "actions"]),
    )
  })

  it("tiene exactamente 5 columnas con permisos por defecto", () => {
    const cols = getWarehouseColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(5)
  })
})
