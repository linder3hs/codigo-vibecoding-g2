import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getCustomerColumns } from "@/lib/columns/customer-columns"
import type { Customer } from "@/types/customer"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseCustomer: Customer = {
  id: 1,
  name: "Acme Corp",
  customer_type: "COMPANY",
  tax_id: "900123456-1",
  email: "acme@example.com",
  phone: "+57 300 0000001",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
  is_active: true,
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Customer> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: { row: { original: Customer } }) => React.ReactNode
}

function findCol(cols: ColumnDef<Customer>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function renderCell(col: AnyColDef, customer: Partial<Customer> = {}) {
  const row = { original: { ...baseCustomer, ...customer } }
  const node = col.cell!({ row })
  return render(<>{node}</>)
}

// ─── customer_type badge ───────────────────────────────────────────────────────

describe("columna customer_type — badge", () => {
  it("COMPANY muestra badge 'Empresa'", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "customer_type")
    renderCell(col, { customer_type: "COMPANY" })
    expect(screen.getByText("Empresa")).toBeInTheDocument()
  })

  it("INDIVIDUAL muestra badge 'Persona'", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn())
    const col = findCol(cols, "customer_type")
    renderCell(col, { customer_type: "INDIVIDUAL" })
    expect(screen.getByText("Persona")).toBeInTheDocument()
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el customer", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getCustomerColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")

    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0]) // primer botón = editar

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el customer", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getCustomerColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")

    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1]) // segundo botón = eliminar

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false no hay botón de editar", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.queryAllByRole("button")
    expect(buttons).toHaveLength(1) // solo eliminar
  })

  it("con canDelete=false no hay botón de eliminar", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.queryAllByRole("button")
    expect(buttons).toHaveLength(1) // solo editar
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    const hasActions = cols.some((c) => c.id === "actions")
    expect(hasActions).toBe(false)
  })
})

// ─── estructura de columnas ────────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("tiene las columnas name, customer_type, email, city, actions", () => {
    const cols = getCustomerColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)
    expect(keys).toEqual(
      expect.arrayContaining(["name", "customer_type", "email", "city", "actions"]),
    )
  })
})
