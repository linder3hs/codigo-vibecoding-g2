"use client"

import { useState, useEffect } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCustomerList } from "@/lib/hooks/use-customers"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Customer, CustomerParams } from "@/types/customer"
import { CustomerFilters } from "@/components/modules/customers/CustomerFilters"
import { CustomerTable } from "@/components/modules/customers/CustomerTable"
import { CustomerForm } from "@/components/modules/customers/CustomerForm"
import { DeleteCustomerDialog } from "@/components/modules/customers/DeleteCustomerDialog"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"

export default function CustomersPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const [params, setParams] = useState<CustomerParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const [deleting, setDeleting] = useState<Customer | undefined>()

  // Sincronizar paginación con params
  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useCustomerList(params)

  const handleEdit = (customer: Customer) => {
    setEditing(customer)
    setFormOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setDeleting(customer)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleNewCustomer = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona los clientes registrados</p>
        </div>
        {canAdd('customer') && (
          <Button onClick={handleNewCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
        )}
      </div>

      {/* Filtros */}
      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <CustomerFilters params={params} onParamsChange={setParams} />
      </FiltersSheet>

      {/* Tabla */}
      <CustomerTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        perms={{ canChange: canChange('customer'), canDelete: canDelete('customer') }}
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
              {editing ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editing}
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
        <DeleteCustomerDialog
          customer={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}
    </div>
  )
}
