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
import { useDeleteTransport } from "@/lib/hooks/use-transport"
import type { Transport } from "@/types/transport"

interface DeleteTransportDialogProps {
  transport: Transport
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteTransportDialog({
  transport,
  open,
  onOpenChange,
}: DeleteTransportDialogProps) {
  const deleteMutation = useDeleteTransport()

  function handleConfirm() {
    deleteMutation.mutate(transport.id, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar transporte?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el vehículo &quot;{transport.plate_number}&quot; ({transport.brand} {transport.model}).
            Esta operación no se puede deshacer y el registro no podrá recuperarse.
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
              "Eliminar permanentemente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
