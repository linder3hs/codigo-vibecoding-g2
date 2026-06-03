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
import { useDeleteShipmentItem } from "@/lib/hooks/use-shipments"
import type { ShipmentItem } from "@/types/shipment"

interface DeleteShipmentItemDialogProps {
  item: ShipmentItem
  shipmentId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteShipmentItemDialog({ item, shipmentId, open, onOpenChange }: DeleteShipmentItemDialogProps) {
  const deleteMutation = useDeleteShipmentItem()

  function handleConfirm() {
    deleteMutation.mutate({ shipmentId, itemId: item.id }, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará <strong>{item.product_name || `Producto #${item.product}`}</strong> (x{item.quantity}) del envío.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
