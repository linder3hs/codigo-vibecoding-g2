"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteWarehouse } from "@/lib/hooks/use-warehouses"
import type { Warehouse } from "@/types/warehouse"

interface DeleteWarehouseDialogProps {
  warehouse: Warehouse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteWarehouseDialog({
  warehouse,
  open,
  onOpenChange,
}: DeleteWarehouseDialogProps) {
  const deleteMutation = useDeleteWarehouse()

  function handleConfirm() {
    deleteMutation.mutate(warehouse.id, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar almacén?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción desactivará el almacén &quot;{warehouse.name}&quot;. Podrás
            restaurarlo desde el panel de administración de Django si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Eliminando...
              </span>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
