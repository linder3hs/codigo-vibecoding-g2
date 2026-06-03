"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useShipmentList } from "@/lib/hooks/use-shipments"
import type { ShipmentStatus } from "@/types/shipment"

const STATUS_LABELS: Record<string, string> = {
  all: "Todos los estados",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  RETURNED: "Devuelto",
}

const BAR_COLOR = "#3b82f6"

interface BarItemProps {
  name: string
  value: number
  max: number
  formatter?: (v: number) => string
}

function BarItem({ name, value, max, formatter }: BarItemProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="group flex items-center gap-3 py-1.5">
      <span className="text-sm text-foreground truncate flex-shrink-0 w-32" title={name}>
        {name}
      </span>
      <div className="flex-1 h-6 rounded-md overflow-hidden bg-muted/50 relative">
        <div
          className="h-full rounded-md transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: BAR_COLOR, opacity: 0.85 }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground tabular-nums flex-shrink-0 w-16 text-right">
        {formatter ? formatter(value) : value}
      </span>
    </div>
  )
}

export function TopCitiesChart() {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all")

  const shared = { status: statusFilter === "all" ? undefined : statusFilter }
  const { data: page1, isPending: l1 } = useShipmentList({ ...shared, page: 1 })
  const { data: page2, isPending: l2 } = useShipmentList({ ...shared, page: 2 })
  const { data: page3, isPending: l3 } = useShipmentList({ ...shared, page: 3 })

  const isLoading = l1 || l2 || l3
  const total = page1?.count ?? 0

  const allShipments = [
    ...(page1?.results ?? []),
    ...(page2?.results ?? []),
    ...(page3?.results ?? []),
  ]

  const cityCount = allShipments.reduce<Record<string, number>>((acc, s) => {
    const city = s.destination_city?.trim() || "Sin ciudad"
    acc[city] = (acc[city] ?? 0) + 1
    return acc
  }, {})

  const barData = Object.entries(cityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))

  const maxValue = barData[0]?.value ?? 1

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Top ciudades destino</CardTitle>
            {!isLoading && total > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Basado en {Math.min(allShipments.length, 60)} de {total} envíos
              </p>
            )}
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: string | null) =>
              setStatusFilter((v ?? "all") as ShipmentStatus | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
              <SelectValue label={STATUS_LABELS[statusFilter]} placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2.5 mt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : barData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-foreground">Sin destinos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter !== "all"
                ? `No hay envíos con estado "${STATUS_LABELS[statusFilter]}"`
                : "Crea envíos para ver los destinos más frecuentes"}
            </p>
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {barData.map((d) => (
              <BarItem
                key={d.name}
                name={d.name}
                value={d.value}
                max={maxValue}
                formatter={(v) => `${v} envío${v !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
