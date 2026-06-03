"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Table } from "@tanstack/react-table"

interface TablePaginationProps<T> {
  table: Table<T>
  totalCount: number
  entityLabel?: string
}

export function TablePagination<T>({ table, totalCount, entityLabel = "registros" }: TablePaginationProps<T>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const from = pageCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalCount)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 py-2">
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        {totalCount === 0 ? (
          `Sin ${entityLabel}`
        ) : (
          <>
            Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{" "}
            <span className="font-medium text-foreground">{totalCount}</span> {entityLabel}
          </>
        )}
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hidden sm:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="flex items-center gap-1 px-2 text-sm font-medium text-foreground min-w-[80px] justify-center">
          {pageCount === 0 ? "—" : `${pageIndex + 1} / ${pageCount}`}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hidden sm:flex"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
