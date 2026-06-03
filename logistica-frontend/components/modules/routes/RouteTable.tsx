"use client"

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { getRouteColumns } from "@/lib/columns/route-columns"
import type { Route } from "@/types/route"
import type { PaginatedResponse } from "@/types/common"

interface RouteTableProps {
  data: PaginatedResponse<Route> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
  onView?: (route: Route) => void
  warehouseMap: Record<number, string>
  perms?: { canChange?: boolean; canDelete?: boolean }
}

export function RouteTable({
  data,
  isLoading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onView,
  warehouseMap,
  perms = {},
}: RouteTableProps) {
  const columns = getRouteColumns(onEdit, onDelete, onView, perms)

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    pageCount: Math.ceil((data?.count ?? 0) / 20),
    state: { pagination },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    meta: { warehouseMap },
  })

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No hay rutas registradas
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination table={table} totalCount={data?.count ?? 0} entityLabel="rutas" />
    </div>
  )
}
