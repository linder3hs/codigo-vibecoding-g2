import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getShipmentColumns } from "@/lib/columns/shipment-columns"
import type { Shipment, ShipmentStatus } from "@/types/shipment"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-20260001",
  customer: 5,
  customer_name: "Empresa ABC",
  origin_warehouse: 3,
  destination_address: "Calle 10 # 20-30",
  destination_city: "Medellín",
  destination_country: "Colombia",
  status: "PENDING",
  estimated_delivery_date: "2026-05-15",
  driver: null,
  transport: null,
  route: null,
  notes: "",
  weight_total_kg: "5.00",
  base_cost: "0.00",
  calculated_cost: "50000.00",
  created_at: "2026-04-01T08:00:00Z",
  updated_at: "2026-04-01T08:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Shipment> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: unknown) => React.ReactNode
}

function findCol(cols: ColumnDef<Shipment>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Shipment> = {}) {
  const d = { ...baseShipment, ...overrides }
  return {
    original: d,
    getValue: (() => undefined) as unknown as () => never,
  }
}

// Columnas que usan getValue() del CellContext
function renderCellWithValue<T>(col: AnyColDef, value: T, overrides: Partial<Shipment> = {}) {
  const row = makeRow(overrides)
  const node = col.cell!({ row, getValue: () => value as unknown as T })
  return render(<>{node}</>)
}

// Columnas que usan row.original (actions, customer_name)
function renderCellWithRow(col: AnyColDef, overrides: Partial<Shipment> = {}) {
  const row = makeRow(overrides)
  const node = col.cell!({ row, getValue: () => undefined as unknown })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("tiene 7 columnas: tracking_number, customer_name, status, destination_city, estimated_delivery_date, calculated_cost, actions", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining([
        "tracking_number",
        "customer_name",
        "status",
        "destination_city",
        "estimated_delivery_date",
        "calculated_cost",
        "actions",
      ]),
    )
    expect(cols).toHaveLength(7)
  })

  it("siempre tiene 7 columnas aunque canChange=false (actions siempre presente)", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn(), { canChange: false })
    expect(cols).toHaveLength(7)
  })
})

// ─── columna tracking_number ──────────────────────────────────────────────────

describe("columna tracking_number", () => {
  it("renderiza el tracking number en span font-mono", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "tracking_number")
    renderCellWithValue(col, "TRK-20260001")

    expect(screen.getByText("TRK-20260001")).toBeInTheDocument()
  })

  it("el span tiene clase font-mono", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "tracking_number")
    renderCellWithValue(col, "TRK-99999")

    const span = screen.getByText("TRK-99999")
    expect(span.tagName).toBe("SPAN")
    expect(span.className).toContain("font-mono")
  })
})

// ─── columna customer_name ────────────────────────────────────────────────────

describe("columna customer_name", () => {
  it("muestra customer_name cuando está disponible", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "customer_name")
    renderCellWithRow(col, { customer_name: "Empresa ABC", customer: 5 })

    expect(screen.getByText("Empresa ABC")).toBeInTheDocument()
  })

  it("muestra '#id' cuando customer_name está vacío", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "customer_name")
    renderCellWithRow(col, { customer_name: "", customer: 5 })

    expect(screen.getByText("#5")).toBeInTheDocument()
  })
})

// ─── columna status (badges) ──────────────────────────────────────────────────

const STATUS_CASES: [ShipmentStatus, string][] = [
  ["PENDING", "Pendiente"],
  ["CONFIRMED", "Confirmado"],
  ["IN_TRANSIT", "En tránsito"],
  ["DELIVERED", "Entregado"],
  ["CANCELLED", "Cancelado"],
  ["RETURNED", "Devuelto"],
]

describe("columna status", () => {
  it.each(STATUS_CASES)("status='%s' muestra badge '%s'", (status, label) => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "status")
    renderCellWithValue<ShipmentStatus>(col, status)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

// ─── columna estimated_delivery_date ──────────────────────────────────────────

describe("columna estimated_delivery_date", () => {
  it("retorna '—' cuando el valor es null", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_delivery_date")
    renderCellWithValue(col, null)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("formatea la fecha YYYY-MM-DD con Intl es-CO dateStyle:medium", () => {
    const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" })
    const [year, month, day] = "2026-05-15".split("-").map(Number)
    const expected = dateFormatter.format(new Date(year, month - 1, day))

    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_delivery_date")
    renderCellWithValue(col, "2026-05-15")

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("retorna '—' cuando el valor es string vacío", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "estimated_delivery_date")
    // "" es falsy → "—"
    renderCellWithValue(col, "")
    // nota: "" es falsy así que !value = true → devuelve "—"
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

// ─── columna calculated_cost ──────────────────────────────────────────────────

describe("columna calculated_cost", () => {
  it("formatea el costo con signo $ y localización es-CO", () => {
    const expected = `$${parseFloat("50000.00").toLocaleString("es-CO")}`

    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "calculated_cost")
    renderCellWithValue(col, "50000.00")

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("formatea costo pequeño correctamente", () => {
    const expected = `$${parseFloat("1500.00").toLocaleString("es-CO")}`

    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "calculated_cost")
    renderCellWithValue(col, "1500.00")

    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("siempre muestra botón Ver (Eye)", () => {
    const onEdit = vi.fn()
    const onView = vi.fn()
    const cols = getShipmentColumns(onEdit, onView)
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it("con canChange=true hay 2 botones (Ver + Editar)", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    expect(screen.getAllByRole("button")).toHaveLength(2)
  })

  it("con canChange=false hay 1 botón solo (Ver)", () => {
    const cols = getShipmentColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    expect(screen.getAllByRole("button")).toHaveLength(1)
  })

  it("clic en Ver (Eye) llama onView", () => {
    const onView = vi.fn()
    const onEdit = vi.fn()
    const cols = getShipmentColumns(onEdit, onView)
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onView).toHaveBeenCalledOnce()
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("clic en Editar (Pencil) llama onEdit", () => {
    const onView = vi.fn()
    const onEdit = vi.fn()
    const cols = getShipmentColumns(onEdit, onView)
    const col = findCol(cols, "actions")
    renderCellWithRow(col)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[1])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onView).not.toHaveBeenCalled()
  })
})
