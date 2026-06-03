"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTransportList } from "@/lib/hooks/use-transport"
import type { Transport, TransportParams } from "@/types/transport"
import { TransportFilters } from "@/components/modules/transport/TransportFilters"
import { TransportTable } from "@/components/modules/transport/TransportTable"
import { TransportForm } from "@/components/modules/transport/TransportForm"
import { DeleteTransportDialog } from "@/components/modules/transport/DeleteTransportDialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"

export default function TransportPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const [params, setParams] = useState<TransportParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transport | undefined>()
  const [deleting, setDeleting] = useState<Transport | undefined>()

  // Sincronizar paginación con params
  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useTransportList(params)

  const handleEdit = (transport: Transport) => {
    setEditing(transport)
    setFormOpen(true)
  }

  const handleDelete = (transport: Transport) => {
    setDeleting(transport)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleNewTransport = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transportes</h1>
          <p className="text-muted-foreground">Gestiona la flota de vehículos</p>
        </div>
        {canAdd('transport') && (
          <Button onClick={handleNewTransport}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo transporte
        </Button>
        )}
      </div>

      {/* Filtros */}
      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <TransportFilters params={params} onParamsChange={setParams} />
      </FiltersSheet>

      {/* Tabla */}
      <TransportTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        perms={{ canChange: canChange('transport'), canDelete: canDelete('transport') }}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar transporte" : "Nuevo transporte"}
            </DialogTitle>
          </DialogHeader>
          <TransportForm
            transport={editing}
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
        <DeleteTransportDialog
          transport={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
