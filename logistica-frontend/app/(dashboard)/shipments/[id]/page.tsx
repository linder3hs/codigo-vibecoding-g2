"use client"

import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ItemList } from "@/components/modules/shipments/ItemList"
import { useShipment } from "@/lib/hooks/use-shipments"
import { STATUS_LABELS } from "@/lib/columns/shipment-columns"
import type { ShipmentStatus } from "@/types/shipment"

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" })

function formatDate(value: string | null): string {
  if (!value) return "—"
  const [year, month, day] = value.split("-").map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

export default function ShipmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const { data: shipment, isPending, isError } = useShipment(id)

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
        <div className="h-60 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium">Envío no encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">El envío no existe o fue eliminado.</p>
        <Button className="mt-4" onClick={() => router.push("/shipments")}>
          Volver a envíos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/shipments")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Envíos
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{shipment.tracking_number}</h1>
            <p className="text-sm text-muted-foreground">Detalle del envío</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/shipments/${id}/edit`)}>
          Editar envío
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Estado</dt>
              <dd className="mt-1">
                <Badge variant="secondary">{STATUS_LABELS[shipment.status as ShipmentStatus] ?? shipment.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</dt>
              <dd className="mt-1 font-medium">{shipment.customer_name || `#${shipment.customer}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Almacén origen</dt>
              <dd className="mt-1 font-medium">#{shipment.origin_warehouse}</dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Destino</dt>
              <dd className="mt-1 font-medium">
                {shipment.destination_address}, {shipment.destination_city}, {shipment.destination_country}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Conductor</dt>
              <dd className="mt-1">{shipment.driver ? `#${shipment.driver}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Transporte</dt>
              <dd className="mt-1">{shipment.transport ? `#${shipment.transport}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Ruta</dt>
              <dd className="mt-1">{shipment.route ? `#${shipment.route}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Entrega estimada</dt>
              <dd className="mt-1">{formatDate(shipment.estimated_delivery_date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Peso total</dt>
              <dd className="mt-1">{parseFloat(shipment.weight_total_kg).toFixed(2)} kg</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Costo calculado</dt>
              <dd className="mt-1 font-semibold">${parseFloat(shipment.calculated_cost).toLocaleString("es-CO")}</dd>
            </div>
            {shipment.notes && (
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Notas</dt>
                <dd className="mt-1">{shipment.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <ItemList shipmentId={id} />
    </div>
  )
}
