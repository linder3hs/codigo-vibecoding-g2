"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"
import { RouteFilters } from "@/components/modules/routes/RouteFilters"
import { RouteTable } from "@/components/modules/routes/RouteTable"
import { RouteForm } from "@/components/modules/routes/RouteForm"
import { DeleteRouteDialog } from "@/components/modules/routes/DeleteRouteDialog"
import { useRouteList } from "@/lib/hooks/use-routes"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { Route, RouteParams } from "@/types/route"

export default function RoutesPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const router = useRouter()

  const [params, setParams] = useState<RouteParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Route | undefined>()
  const [deleting, setDeleting] = useState<Route | undefined>()

  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useRouteList(params)
  const { data: warehousesData } = useWarehouseList({ page: 1 })

  const warehouseMap = useMemo<Record<number, string>>(
    () => Object.fromEntries((warehousesData?.results ?? []).map((w) => [w.id, w.name])),
    [warehousesData]
  )

  function handleParamsChange(newParams: RouteParams) {
    setParams(newParams)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  function handleEdit(route: Route) {
    setEditing(route)
    setFormOpen(true)
  }

  function handleFormSuccess() {
    setFormOpen(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutas</h1>
          <p className="text-muted-foreground">Gestiona las rutas de transporte</p>
        </div>
        {canAdd('route') && (
          <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva ruta
        </Button>
        )}
      </div>

      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <RouteFilters params={params} onParamsChange={handleParamsChange} />
      </FiltersSheet>

      <RouteTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={(route) => setDeleting(route)}
        onView={(route) => router.push(`/routes/${route.id}`)}
        warehouseMap={warehouseMap}
        perms={{ canChange: canChange('route'), canDelete: canDelete('route') }}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditing(undefined)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ruta" : "Nueva ruta"}</DialogTitle>
          </DialogHeader>
          <RouteForm
            route={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditing(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {deleting && (
        <DeleteRouteDialog
          route={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
