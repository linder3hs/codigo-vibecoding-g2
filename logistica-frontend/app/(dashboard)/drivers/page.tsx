"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect } from "react"
import { type PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"
import { DriverFilters } from "@/components/modules/drivers/DriverFilters"
import { DriverTable } from "@/components/modules/drivers/DriverTable"
import { DriverForm } from "@/components/modules/drivers/DriverForm"
import { DeleteDriverDialog } from "@/components/modules/drivers/DeleteDriverDialog"
import { useDriverList } from "@/lib/hooks/use-drivers"
import type { Driver, DriverParams } from "@/types/driver"

export default function DriversPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const [params, setParams] = useState<DriverParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | undefined>()
  const [deleting, setDeleting] = useState<Driver | undefined>()

  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useDriverList(params)

  function handleEdit(driver: Driver) {
    setEditing(driver)
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
          <h1 className="text-2xl font-bold">Conductores</h1>
          <p className="text-muted-foreground">Gestiona los conductores del sistema</p>
        </div>
        {canAdd('driver') && (
          <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo conductor
        </Button>
        )}
      </div>

      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <DriverFilters params={params} onParamsChange={setParams} />
      </FiltersSheet>

      <DriverTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={(driver) => setDeleting(driver)}
        perms={{ canChange: canChange('driver'), canDelete: canDelete('driver') }}
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
            <DialogTitle>{editing ? "Editar conductor" : "Nuevo conductor"}</DialogTitle>
          </DialogHeader>
          <DriverForm
            driver={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditing(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {deleting && (
        <DeleteDriverDialog
          driver={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
