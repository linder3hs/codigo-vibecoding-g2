"use client"

import { useRouter } from "next/navigation"
import { ShipmentForm } from "@/components/modules/shipments/ShipmentForm"

export default function NewShipmentPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo envío</h1>
        <p className="text-muted-foreground">Completa los datos del nuevo envío</p>
      </div>

      <ShipmentForm
        onSuccess={() => router.push("/shipments")}
        onCancel={() => router.push("/shipments")}
      />
    </div>
  )
}
