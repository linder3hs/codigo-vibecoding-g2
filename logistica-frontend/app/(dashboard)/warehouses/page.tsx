"use client"

import { useState, useEffect } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { Warehouse, WarehouseParams } from "@/types/warehouse"
import { WarehouseFilters } from "@/components/modules/warehouses/WarehouseFilters"
import { WarehouseTable } from "@/components/modules/warehouses/WarehouseTable"
import { WarehouseForm } from "@/components/modules/warehouses/WarehouseForm"
import { DeleteWarehouseDialog } from "@/components/modules/warehouses/DeleteWarehouseDialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"

export default function WarehousesPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const [params, setParams] = useState<WarehouseParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | undefined>()
  const [deleting, setDeleting] = useState<Warehouse | undefined>()

  // Sincronizar paginación con params
  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useWarehouseList(params)

  const handleEdit = (warehouse: Warehouse) => {
    setEditing(warehouse)
    setFormOpen(true)
  }

  const handleDelete = (warehouse: Warehouse) => {
    setDeleting(warehouse)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleNewWarehouse = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Almacenes</h1>
          <p className="text-muted-foreground">Gestiona los puntos de almacenamiento</p>
        </div>
        {canAdd('warehouse') && (
          <Button onClick={handleNewWarehouse}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo almacén
        </Button>
        )}
      </div>

      {/* Filtros */}
      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <WarehouseFilters params={params} onParamsChange={setParams} />
      </FiltersSheet>

      {/* Tabla */}
      <WarehouseTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        perms={{ canChange: canChange('warehouse'), canDelete: canDelete('warehouse') }}
      />

      {/* Modal crear/editar */}
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
            <DialogTitle>
              {editing ? "Editar almacén" : "Nuevo almacén"}
            </DialogTitle>
          </DialogHeader>
          <WarehouseForm
            warehouse={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditing(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación eliminación */}
      {deleting && (
        <DeleteWarehouseDialog
          warehouse={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
