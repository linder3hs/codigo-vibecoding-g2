import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getRouteColumns } from "@/lib/columns/route-columns"
import type { Route } from "@/types/route"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseRoute: Route = {
  id: 1,
  name: "Ruta Bogotá - Medellín",
  origin_warehouse: 3,
  estimated_duration_hours: "8.50",
  estimated_distance_km: "450.00",
  is_active: true,
  created_at: "2026-03-01T08:00:00Z",
  updated_at: "2026-03-01T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Route> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: unknown) => React.ReactNode
}

function findCol(cols: ColumnDef<Route>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Route> = {}) {
  const d = { ...baseRoute, ...overrides }
  return {
    original: d,
    getValue: () => undefined,
  }
}

function renderCell(
  col: AnyColDef,
  overrides: Partial<Route> = {},
  warehouseMap?: Record<number, string>,
) {
  const row = makeRow(overrides)
  const table = { options: { meta: warehouseMap ? { warehouseMap } : undefined } }
  const node = col.cell!({ row, table })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene name, origin_warehouse, estimated_distance_km, estimated_duration_hours, actions", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining([
        "name",
        "origin_warehouse",
        "estimated_distance_km",
        "estimated_duration_hours",
        "actions",
      ]),
    )
  })

  it("tiene exactamente 5 columnas con permisos por defecto", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(5)
  })

  it("sin permisos ni onView hay exactamente 4 columnas (sin actions)", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), undefined, {
      canChange: false,
      canDelete: false,
    })
    expect(cols).toHaveLength(4)
  })

  it("con onView pero sin canChange ni canDelete hay 5 columnas", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    })
    expect(cols).toHaveLength(5)
  })
})

// ─── columna origin_warehouse ─────────────────────────────────────────────────

describe("columna origin_warehouse", () => {
  it("muestra nombre del almacén cuando warehouseMap lo contiene", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "origin_warehouse")
    renderCell(col, {}, { 3: "CEDI Bogotá" })

    expect(screen.getByText("CEDI Bogotá")).toBeInTheDocument()
  })

  it("muestra '#id' cuando el id no está en warehouseMap", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "origin_warehouse")
    renderCell(col, {}, { 99: "Otro almacén" })

    expect(screen.getByText("#3")).toBeInTheDocument()
  })

  it("muestra '#id' cuando no hay meta en la tabla", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "origin_warehouse")
    renderCell(col)

    expect(screen.getByText("#3")).toBeInTheDocument()
  })

  it("muestra el nombre correcto para diferente origin_warehouse", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "origin_warehouse")
    renderCell(col, { origin_warehouse: 7 }, { 7: "Bodega Medellín" })

    expect(screen.getByText("Bodega Medellín")).toBeInTheDocument()
  })
})

// ─── columna estimated_distance_km ────────────────────────────────────────────

describe("columna estimated_distance_km", () => {
  it("formatea '450.00' como '450.00 km'", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_distance_km")
    renderCell(col, { estimated_distance_km: "450.00" })

    expect(screen.getByText("450.00 km")).toBeInTheDocument()
  })

  it("formatea '125.5' como '125.50 km' (dos decimales)", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_distance_km")
    renderCell(col, { estimated_distance_km: "125.5" })

    expect(screen.getByText("125.50 km")).toBeInTheDocument()
  })

  it("formatea '1000' como '1000.00 km'", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_distance_km")
    renderCell(col, { estimated_distance_km: "1000" })

    expect(screen.getByText("1000.00 km")).toBeInTheDocument()
  })
})

// ─── columna estimated_duration_hours ─────────────────────────────────────────

describe("columna estimated_duration_hours", () => {
  it("formatea '8.50' como '8.50 h'", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_duration_hours")
    renderCell(col, { estimated_duration_hours: "8.50" })

    expect(screen.getByText("8.50 h")).toBeInTheDocument()
  })

  it("formatea '3' como '3.00 h' (dos decimales)", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_duration_hours")
    renderCell(col, { estimated_duration_hours: "3" })

    expect(screen.getByText("3.00 h")).toBeInTheDocument()
  })

  it("formatea '12.75' como '12.75 h'", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_duration_hours")
    renderCell(col, { estimated_duration_hours: "12.75" })

    expect(screen.getByText("12.75 h")).toBeInTheDocument()
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en ver (Eye) llama onView con la ruta", () => {
    const onView = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getRouteColumns(onEdit, onDelete, onView)
    const col = findCol(cols, "actions")
    renderCell(col)

    // 3 buttons: Eye, Pencil, Trash2
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(3)
    fireEvent.click(buttons[0])

    expect(onView).toHaveBeenCalledOnce()
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en editar (Pencil) llama onEdit con la ruta", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getRouteColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    // 2 buttons: Pencil, Trash2 (no onView)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar (Trash2) llama onDelete con la ruta", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getRouteColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con onView, canChange=true, canDelete=true hay 3 botones", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), vi.fn())
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.getAllByRole("button")).toHaveLength(3)
  })

  it("con canChange=false solo hay botón eliminar (y no editar)", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), undefined, { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón editar (y no eliminar)", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), undefined, { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false y sin onView no hay columna actions", () => {
    const cols = getRouteColumns(vi.fn(), vi.fn(), undefined, {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })

  it("con solo onView (sin edit ni delete) hay 1 botón en actions", () => {
    const cols = getRouteColumns(
      vi.fn(),
      vi.fn(),
      vi.fn(),
      { canChange: false, canDelete: false },
    )
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })
})
