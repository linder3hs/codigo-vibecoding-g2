"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RouteForm } from "@/components/modules/routes/RouteForm"
import { DeleteRouteDialog } from "@/components/modules/routes/DeleteRouteDialog"
import { StopList } from "@/components/modules/routes/StopList"
import { useRoute } from "@/lib/hooks/use-routes"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"

export default function RouteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [editFormOpen, setEditFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: route, isPending, isError } = useRoute(id)
  const { data: warehousesData } = useWarehouseList({ page: 1 })

  const warehouseMap = useMemo<Record<number, string>>(
    () => Object.fromEntries((warehousesData?.results ?? []).map((w) => [w.id, w.name])),
    [warehousesData]
  )

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
        <div className="h-60 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (isError || !route) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium">Ruta no encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          La ruta que buscas no existe o fue eliminada.
        </p>
        <Button className="mt-4" onClick={() => router.push("/routes")}>
          Volver a rutas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/routes")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Rutas
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{route.name}</h1>
            <p className="text-sm text-muted-foreground">Detalle de ruta</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditFormOpen(true)}>
            Editar ruta
          </Button>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Eliminar ruta
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Almacén origen</dt>
              <dd className="mt-1 font-medium">
                {warehouseMap[route.origin_warehouse] ?? `#${route.origin_warehouse}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Distancia</dt>
              <dd className="mt-1 font-medium">
                {parseFloat(route.estimated_distance_km).toFixed(2)} km
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Duración estimada</dt>
              <dd className="mt-1 font-medium">
                {parseFloat(route.estimated_duration_hours).toFixed(2)} horas
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Estado</dt>
              <dd className="mt-1 font-medium">{route.is_active ? "Activa" : "Inactiva"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <StopList routeId={id} />

      <Dialog
        open={editFormOpen}
        onOpenChange={(open) => {
          if (!open) setEditFormOpen(false)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar ruta</DialogTitle>
          </DialogHeader>
          <RouteForm
            route={route}
            onSuccess={() => setEditFormOpen(false)}
            onCancel={() => setEditFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <DeleteRouteDialog
        route={route}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => router.push("/routes")}
      />
    </div>
  )
}
