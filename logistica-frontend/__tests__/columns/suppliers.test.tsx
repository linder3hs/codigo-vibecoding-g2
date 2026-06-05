import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { getSupplierColumns } from "@/lib/columns/supplier-columns"
import type { Supplier } from "@/types/supplier"
import type { ColumnDef } from "@tanstack/react-table"

// ─── fixture ───────────────────────────────────────────────────────────────────

const baseSupplier: Supplier = {
  id: 5,
  name: "Distribuidora Norte",
  contact_name: "Juan Pérez",
  email: "juan@norte.com",
  phone: "+57 300 1111111",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
  tax_id: "800111222-3",
  is_active: true,
  created_at: "2026-02-01T09:00:00Z",
  updated_at: "2026-02-01T09:00:00Z",
}

// ─── helpers ───────────────────────────────────────────────────────────────────

type AnyColDef = ColumnDef<Supplier> & {
  accessorKey?: string
  id?: string
  cell?: (ctx: {
    row: { original: Supplier; getValue: (key: string) => unknown }
  }) => React.ReactNode
}

function findCol(cols: ColumnDef<Supplier>[], key: string): AnyColDef {
  const col = cols.find(
    (c) => (c as AnyColDef).accessorKey === key || (c as AnyColDef).id === key,
  ) as AnyColDef
  if (!col) throw new Error(`Column "${key}" not found`)
  return col
}

function makeRow(overrides: Partial<Supplier> = {}) {
  const s = { ...baseSupplier, ...overrides }
  return {
    original: s,
    getValue: (key: string) => s[key as keyof Supplier],
  }
}

function renderCell(col: AnyColDef, overrides: Partial<Supplier> = {}) {
  const node = col.cell!({ row: makeRow(overrides) })
  return render(<>{node}</>)
}

// ─── estructura de columnas ───────────────────────────────────────────────────

describe("estructura de columnas", () => {
  it("contiene name, contact_name, email, city y actions", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn()) as AnyColDef[]
    const keys = cols.map((c) => c.accessorKey ?? c.id)

    expect(keys).toEqual(
      expect.arrayContaining(["name", "contact_name", "email", "city", "actions"]),
    )
  })

  it("tiene exactamente 5 columnas con permisos por defecto", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn())
    expect(cols).toHaveLength(5)
  })

  it("encabezados correctos para name, contact_name, email, city", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn()) as AnyColDef[]

    const headers: Record<string, string> = {
      name: "Proveedor",
      contact_name: "Contacto",
      email: "Email",
      city: "Ciudad",
    }

    for (const [key, expectedHeader] of Object.entries(headers)) {
      const col = findCol(cols, key)
      const headerNode = typeof col.header === "function"
        ? col.header({} as Parameters<typeof col.header>[0])
        : col.header
      expect(String(headerNode)).toBe(expectedHeader)
    }
  })
})

// ─── columna actions ──────────────────────────────────────────────────────────

describe("columna actions", () => {
  it("clic en editar llama onEdit con el supplier", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getSupplierColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("clic en eliminar llama onDelete con el supplier", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const cols = getSupplierColumns(onEdit, onDelete)
    const col = findCol(cols, "actions")
    renderCell(col)

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it("con canChange=false solo hay botón de eliminar", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn(), { canChange: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canDelete=false solo hay botón de editar", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn(), { canDelete: false })
    const col = findCol(cols, "actions")
    renderCell(col)

    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("con canChange=false y canDelete=false no hay columna actions", () => {
    const cols = getSupplierColumns(vi.fn(), vi.fn(), {
      canChange: false,
      canDelete: false,
    }) as AnyColDef[]

    expect(cols.some((c) => c.id === "actions")).toBe(false)
  })
})
