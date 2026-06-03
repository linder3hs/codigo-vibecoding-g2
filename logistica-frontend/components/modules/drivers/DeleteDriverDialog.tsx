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
import { useDeleteDriver } from "@/lib/hooks/use-drivers"
import type { Driver } from "@/types/driver"

interface DeleteDriverDialogProps {
  driver: Driver
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDriverDialog({ driver, open, onOpenChange }: DeleteDriverDialogProps) {
  const deleteMutation = useDeleteDriver()

  function handleConfirm() {
    deleteMutation.mutate(driver.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar conductor?</AlertDialogTitle>
          <AlertDialogDescription>
            El conductor <strong>{driver.user_full_name}</strong> será marcado como inactivo.
            Podrás reactivarlo desde el panel de administración.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
