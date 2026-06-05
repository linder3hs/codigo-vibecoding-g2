import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getDriverColumns } from "@/lib/columns/driver-columns"
import type { Driver } from "@/types/driver"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseDriver: Driver = {
  id: 4,
  user: 8,
  user_full_name: "Carlos Ramírez",
  user_email: "carlos@empresa.com",
  user_username: "carlos.r",
  transport: 2,
  license_number: "LIC-001234",
  license_expiry: "2027-06-30",
  phone: "+57 310 000 0000",
  is_active: true,
  created_at: "2026-02-10T09:00:00Z",
  updated_at: "2026-02-10T09:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Driver> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: {
    row: { original: Driver; getValue: (key: string) => unknown }
    getValue: <T>() => T
  }) => React.ReactNode
}

function findCol(cols: ColumnDef<Driver>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Driver> = {}) {
  const d = { ...baseDriver, ...overrides }
  return {
    original: d,
    getValue: ((key?: string) => {
      if (!key) return undefined
      return d[key as keyof Driver]
    }) as unknown as () => never,
  }
}

// Wrapper para columnas que usan `getValue()` del CellContext (sin argumentos)
// — el cell recibe el contexto completo; pasamos getValue como closure
function renderCellWithValue<T>(
  col: AnyColDef,
  value: T,
  overrides: Partial<Driver> = {},
) {
  const row = makeRow(overrides)
  const node = col.cell!({
    row,
    getValue: () => value as unknown as T,
  })
  return render(<>{node}</>)
}

function renderCellWithRow(col: AnyColDef, overrides: Partial<Driver> = {}) {
  const row = makeRow(overrides)
  const node = col.cell!({ row, getValue: () => undefined as unknown })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene user_full_name, user_email, license_number, license_expiry, transport, is_active y actions", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining([
        "user_full_name",
        "user_email",
        "license_number",
        "license_expiry",
        "transport",
        "is_active",
        "actions",
      ]),
    )
  })

  it("tiene exactamente 7 columnas con permisos por defecto", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(7)
  })
})

// ─── columna license_expiry ───────────────────────────────────────────────────

describe("columna license_expiry", () => {
  it("formatea la fecha YYYY-MM-DD al formato localizado es-CO", () => {
    // Calcular el valor esperado con la misma lógica que la columna
    const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "short" })
    const [year, month, day] = "2027-06-30".split("-").map(Number)
    const expected = dateFormatter.format(new Date(year, month - 1, day))

    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "license_expiry")
    renderCellWithValue(col, "2027-06-30")

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("muestra '—' cuando el valor está vacío", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "license_expiry")
    renderCellWithValue(col, "")

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("muestra '—' cuando el valor es null", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "license_expiry")
    renderCellWithValue(col, null)

    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

// ─── columna transport ────────────────────────────────────────────────────────

describe("columna transport", () => {
  it("muestra '#id' cuando hay transporte asignado", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport")
    renderCellWithValue(col, 2)

    expect(screen.getByText("#2")).toBeInTheDocument()
  })

  it("muestra '—' cuando transport es null", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport")
    renderCellWithValue(col, null)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("muestra el id correcto para otro transporte", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "transport")
    renderCellWithValue(col, 7)

    expect(screen.getByText("#7")).toBeInTheDocument()
  })
})

// ─── columna is_active (badge) ────────────────────────────────────────────────

describe("columna is_active", () => {
  it("is_active=true muestra badge 'Activo'", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "is_active")
    renderCellWithValue(col, true)

    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("is_active=false muestra badge 'Inactivo'", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "is_active")
    renderCellWithValue(col, false)

    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el conductor", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getDriverColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el conductor", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getDriverColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false solo hay botón de eliminar", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón de editar", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })

  it("sin actions hay exactamente 6 columnas", () => {
    const cols = getDriverColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    })
    expect(cols).toHaveLength(6)
  })
})
