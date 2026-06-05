import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getTransportColumns } from "@/lib/columns/transport-columns"
import type { Transport } from "@/types/transport"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseTransport: Transport = {
  id: 2,
  plate_number: "ABC-123",
  transport_type: "TRUCK",
  brand: "Ford",
  model: "Transit",
  year: 2022,
  capacity_kg: "1500.00",
  capacity_m3: "12.50",
  is_available: true,
  created_at: "2026-01-15T08:00:00Z",
  updated_at: "2026-01-15T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Transport> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: {
    row: { original: Transport; getValue: (key: string) => unknown }
  }) => React.ReactNode
}

function findCol(cols: ColumnDef<Transport>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Transport> = {}) {
  const t = { ...baseTransport, ...overrides }
  return {
    original: t,
    getValue: (key: string) => t[key as keyof Transport],
  }
}

function renderCell(col: AnyColDef, overrides: Partial<Transport> = {}) {
  const node = col.cell!({ row: makeRow(overrides) })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene plate_number, transport_type, brand_model, capacity_kg, is_available y actions", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining([
        "plate_number",
        "transport_type",
        "brand_model",
        "capacity_kg",
        "is_available",
        "actions",
      ]),
    )
  })

  it("tiene exactamente 6 columnas con permisos por defecto", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(6)
  })
})

// ─── columna transport_type (badge) ──────────────────────────────────────────

describe("columna transport_type", () => {
  it("TRUCK muestra badge con texto 'Camión'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport_type")
    renderCell(col, { transport_type: "TRUCK" })

    expect(screen.getByText("Camión")).toBeInTheDocument()
  })

  it("VAN muestra badge con texto 'Van'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport_type")
    renderCell(col, { transport_type: "VAN" })

    expect(screen.getByText("Van")).toBeInTheDocument()
  })

  it("MOTORCYCLE muestra badge con texto 'Moto'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport_type")
    renderCell(col, { transport_type: "MOTORCYCLE" })

    expect(screen.getByText("Moto")).toBeInTheDocument()
  })

  it("CARGO_BIKE muestra badge con texto 'Cargo Bike'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport_type")
    renderCell(col, { transport_type: "CARGO_BIKE" })

    expect(screen.getByText("Cargo Bike")).toBeInTheDocument()
  })
})

// ─── columna brand_model (compuesta) ─────────────────────────────────────────

describe("columna brand_model", () => {
  it("combina brand y model en un solo texto", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "brand_model")
    renderCell(col)

    expect(screen.getByText("Ford Transit")).toBeInTheDocument()
  })

  it("muestra la combinación correcta para otra marca", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "brand_model")
    renderCell(col, { brand: "Renault", model: "Master" })

    expect(screen.getByText("Renault Master")).toBeInTheDocument()
  })
})

// ─── columna is_available (badge) ────────────────────────────────────────────

describe("columna is_available", () => {
  it("is_available=true muestra badge 'Disponible'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "is_available")
    renderCell(col, { is_available: true })

    expect(screen.getByText("Disponible")).toBeInTheDocument()
  })

  it("is_available=false muestra badge 'No disponible'", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "is_available")
    renderCell(col, { is_available: false })

    expect(screen.getByText("No disponible")).toBeInTheDocument()
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el transporte", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getTransportColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el transporte", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getTransportColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false solo hay botón de eliminar", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón de editar", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })

  it("sin actions hay exactamente 5 columnas", () => {
    const cols = getTransportColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    })
    expect(cols).toHaveLength(5)
  })
})
