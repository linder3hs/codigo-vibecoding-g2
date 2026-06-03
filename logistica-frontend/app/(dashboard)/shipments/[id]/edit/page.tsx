"use client"

import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShipmentForm } from "@/components/modules/shipments/ShipmentForm"
import { useShipment } from "@/lib/hooks/use-shipments"

export default function EditShipmentPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const { data: shipment, isPending, isError } = useShipment(id)

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
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
      <div>
        <h1 className="text-2xl font-bold">Editar envío</h1>
        <p className="text-muted-foreground font-mono text-sm">{shipment.tracking_number}</p>
      </div>

      <ShipmentForm
        shipment={shipment}
        onSuccess={() => router.push("/shipments")}
        onCancel={() => router.push(`/shipments/${id}`)}
      />
    </div>
  )
}
