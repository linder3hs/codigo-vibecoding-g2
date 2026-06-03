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
import { useDeleteRouteStop } from "@/lib/hooks/use-routes"
import type { RouteStop } from "@/types/route"

interface DeleteStopDialogProps {
  routeId: number
  stop: RouteStop
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteStopDialog({ routeId, stop, open, onOpenChange }: DeleteStopDialogProps) {
  const deleteMutation = useDeleteRouteStop(routeId)

  function handleConfirm() {
    deleteMutation.mutate(stop.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar parada?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará la parada <strong>#{stop.stop_order}</strong> en{" "}
            <strong>{stop.address}, {stop.city}</strong>. Esta acción no se puede deshacer.
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
