"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/dashboard/ChartTooltip"
import { useTransportList } from "@/lib/hooks/use-transport"

const TRANSPORT_TYPE_LABELS: Record<string, string> = {
  TRUCK: "Camión",
  VAN: "Van",
  MOTORCYCLE: "Moto",
  CARGO_BIKE: "Cargo Bike",
}

const AVAILABLE_COLOR = "#10b981"
const UNAVAILABLE_COLOR = "#f43f5e"

export function FleetAvailabilityChart() {
  const { data: available, isPending: l1 } = useTransportList({ is_available: true, page: 1 })
  const { data: unavailable, isPending: l2 } = useTransportList({ is_available: false, page: 1 })

  const typeBreakdown = available?.results.reduce<Record<string, number>>((acc, t) => {
    acc[t.transport_type] = (acc[t.transport_type] ?? 0) + 1
    return acc
  }, {}) ?? {}

  const availableCount = available?.count ?? 0
  const unavailableCount = unavailable?.count ?? 0
  const total = availableCount + unavailableCount
  const availablePct = total > 0 ? Math.round((availableCount / total) * 100) : 0

  const pieData = [
    { name: "Disponible", value: availableCount, color: AVAILABLE_COLOR },
    { name: "No disponible", value: unavailableCount, color: UNAVAILABLE_COLOR },
  ].filter((d) => d.value > 0)

  const typeData = Object.entries(typeBreakdown).map(([type, count]) => ({
    name: TRANSPORT_TYPE_LABELS[type] ?? type,
    value: count,
  }))

  const isLoading = l1 || l2

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Disponibilidad de flota</CardTitle>
          {!isLoading && total > 0 && (
            <span className="text-sm font-medium text-muted-foreground">{total} vehículos</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="mx-auto h-44 w-44 rounded-full bg-muted animate-pulse" />
            <div className="h-16 bg-muted rounded animate-pulse mt-4" />
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-foreground">Sin vehículos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Agrega vehículos en el módulo de Transporte</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={pieData.length > 1 ? 2 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Porcentaje en el centro */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{availablePct}%</p>
                  <p className="text-xs text-muted-foreground">disponible</p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div
                className="flex flex-col items-center rounded-xl p-3"
                style={{ backgroundColor: `${AVAILABLE_COLOR}18` }}
              >
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: AVAILABLE_COLOR }}
                >
                  {availableCount}
                </span>
                <span className="text-xs font-medium mt-0.5" style={{ color: AVAILABLE_COLOR }}>
                  Disponibles
                </span>
              </div>
              <div
                className="flex flex-col items-center rounded-xl p-3"
                style={{ backgroundColor: `${UNAVAILABLE_COLOR}18` }}
              >
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: UNAVAILABLE_COLOR }}
                >
                  {unavailableCount}
                </span>
                <span className="text-xs font-medium mt-0.5" style={{ color: UNAVAILABLE_COLOR }}>
                  No disponibles
                </span>
              </div>
            </div>

            {/* Desglose por tipo */}
            {typeData.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Disponibles por tipo
                </p>
                <div className="space-y-2">
                  {typeData.map((t) => (
                    <div key={t.name} className="flex items-center justify-between gap-2">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div
                          className="h-1.5 rounded-full flex-1"
                          style={{
                            background: `linear-gradient(to right, ${AVAILABLE_COLOR} ${(t.value / availableCount) * 100}%, #e5e7eb ${(t.value / availableCount) * 100}%)`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-foreground whitespace-nowrap">{t.name}</span>
                      <span className="text-xs font-semibold text-foreground tabular-nums w-4 text-right">
                        {t.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
