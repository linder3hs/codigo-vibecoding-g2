"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSupplierList } from "@/lib/hooks/use-suppliers"
import type { Supplier, SupplierParams } from "@/types/supplier"
import { SupplierFilters } from "@/components/modules/suppliers/SupplierFilters"
import { SupplierTable } from "@/components/modules/suppliers/SupplierTable"
import { SupplierForm } from "@/components/modules/suppliers/SupplierForm"
import { DeleteSupplierDialog } from "@/components/modules/suppliers/DeleteSupplierDialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"

export default function SuppliersPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const [params, setParams] = useState<SupplierParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleting, setDeleting] = useState<Supplier | undefined>()

  // Sincronizar paginación con params
  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useSupplierList(params)

  const handleEdit = (supplier: Supplier) => {
    setEditing(supplier)
    setFormOpen(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setDeleting(supplier)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleNewSupplier = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los proveedores de productos</p>
        </div>
        {canAdd('supplier') && (
          <Button onClick={handleNewSupplier}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proveedor
        </Button>
        )}
      </div>

      {/* Filtros */}
      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <SupplierFilters params={params} onParamsChange={setParams} />
      </FiltersSheet>

      {/* Tabla */}
      <SupplierTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        perms={{ canChange: canChange('supplier'), canDelete: canDelete('supplier') }}
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
              {editing ? "Editar proveedor" : "Nuevo proveedor"}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={editing}
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
        <DeleteSupplierDialog
          supplier={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
