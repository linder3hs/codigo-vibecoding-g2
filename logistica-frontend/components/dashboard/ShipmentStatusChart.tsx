"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/dashboard/ChartTooltip"
import { useShipmentList } from "@/lib/hooks/use-shipments"
import type { ShipmentStatus } from "@/types/shipment"

const STATUS_CONFIG: { status: ShipmentStatus; label: string; color: string }[] = [
  { status: "PENDING",    label: "Pendiente",   color: "#f59e0b" },
  { status: "CONFIRMED",  label: "Confirmado",  color: "#3b82f6" },
  { status: "IN_TRANSIT", label: "En tránsito", color: "#f97316" },
  { status: "DELIVERED",  label: "Entregado",   color: "#10b981" },
  { status: "CANCELLED",  label: "Cancelado",   color: "#ef4444" },
  { status: "RETURNED",   label: "Devuelto",    color: "#8b5cf6" },
]

function useStatusCounts() {
  return STATUS_CONFIG.map((s) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ...useShipmentList({ status: s.status, page: 1 }),
    config: s,
  }))
}

export function ShipmentStatusChart() {
  const queries = useStatusCounts()
  const isLoading = queries.some((q) => q.isPending)

  const withCounts = queries.map((q) => ({
    config: q.config,
    count: q.data?.count ?? 0,
  }))

  const total = withCounts.reduce((sum, x) => sum + x.count, 0)
  const active = withCounts.filter((x) => x.count > 0)

  const pieData = active.map((x) => ({
    name: x.config.label,
    value: x.count,
    color: x.config.color,
  }))

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Estado de envíos</CardTitle>
          {!isLoading && total > 0 && (
            <span className="text-sm font-medium text-muted-foreground">{total} total</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="mx-auto h-44 w-44 rounded-full bg-muted animate-pulse" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : pieData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-muted-foreground">0</span>
            </div>
            <p className="text-sm font-medium text-foreground">Sin envíos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Los datos aparecerán aquí cuando haya envíos</p>
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
                    paddingAngle={2}
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
              {/* Total en el centro */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{total}</p>
                  <p className="text-xs text-muted-foreground">envíos</p>
                </div>
              </div>
            </div>

            {/* Leyenda con todos los estados */}
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {withCounts.map(({ config, count }) => (
                <div key={config.status} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-foreground flex-1 truncate">{config.label}</span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: count > 0 ? config.color : undefined }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
