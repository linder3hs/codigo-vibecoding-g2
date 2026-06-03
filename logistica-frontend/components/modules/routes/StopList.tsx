"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StopForm } from "@/components/modules/routes/StopForm"
import { DeleteStopDialog } from "@/components/modules/routes/DeleteStopDialog"
import { useRouteStops } from "@/lib/hooks/use-routes"
import type { RouteStop } from "@/types/route"

interface StopListProps {
  routeId: number
}

export function StopList({ routeId }: StopListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<RouteStop | undefined>()
  const [deletingStop, setDeletingStop] = useState<RouteStop | undefined>()

  const { data: stops, isPending } = useRouteStops(routeId)

  function handleAdd() {
    setEditingStop(undefined)
    setFormOpen(true)
  }

  function handleEdit(stop: RouteStop) {
    setEditingStop(stop)
    setFormOpen(true)
  }

  function handleFormSuccess() {
    setFormOpen(false)
    setEditingStop(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Paradas</h2>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar parada
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : !stops || stops.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
          No hay paradas registradas para esta ruta
        </p>
      ) : (
        <div className="border rounded-md divide-y">
          {[...stops]
            .sort((a, b) => a.stop_order - b.stop_order)
            .map((stop) => (
              <div key={stop.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {stop.stop_order}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{stop.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.city} · {parseFloat(stop.estimated_offset_hours).toFixed(2)} h desde origen
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(stop)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingStop(stop)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditingStop(undefined)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStop ? "Editar parada" : "Agregar parada"}</DialogTitle>
          </DialogHeader>
          <StopForm
            routeId={routeId}
            stop={editingStop}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditingStop(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {deletingStop && (
        <DeleteStopDialog
          routeId={routeId}
          stop={deletingStop}
          open={!!deletingStop}
          onOpenChange={(open) => {
            if (!open) setDeletingStop(undefined)
          }}
        />
      )}
    </div>
  )
}
