"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/dashboard/ChartTooltip"
import { useTransportList } from "@/lib/hooks/use-transport"
import type { TransportType } from "@/types/transport"

const AVAILABLE_COLOR = "#10b981"
const UNAVAILABLE_COLOR = "#f43f5e"

const TRANSPORT_TYPES: { type: TransportType; label: string }[] = [
  { type: "TRUCK",      label: "Camión" },
  { type: "VAN",        label: "Van" },
  { type: "MOTORCYCLE", label: "Moto" },
  { type: "CARGO_BIKE", label: "Cargo Bike" },
]

function useTypeCounts() {
  return TRANSPORT_TYPES.map((t) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ...useTransportList({ transport_type: t.type, page: 1 }),
    label: t.label,
    type: t.type,
  }))
}

function CustomLegend() {
  return (
    <div className="flex justify-center gap-6 mt-2">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: AVAILABLE_COLOR }} />
        <span className="text-xs text-foreground font-medium">Disponibles</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: UNAVAILABLE_COLOR }} />
        <span className="text-xs text-foreground font-medium">No disponibles</span>
      </div>
    </div>
  )
}

export function TransportTypeChart() {
  const queries = useTypeCounts()
  const isLoading = queries.some((q) => q.isPending)

  const chartData = queries.map((q) => {
    const total = q.data?.count ?? 0
    const available = q.data?.results.filter((t) => t.is_available).length ?? 0
    const unavailable = total > 0 ? total - available : 0
    return {
      tipo: q.label,
      Disponibles: available,
      "No disponibles": unavailable,
      total,
    }
  })

  const totalVehicles = chartData.reduce((sum, d) => sum + d.total, 0)
  const hasData = chartData.some((d) => d.total > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Flota por tipo de transporte</CardTitle>
          {!isLoading && totalVehicles > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {totalVehicles} vehículos
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-52 bg-muted rounded animate-pulse" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-52 text-center">
            <p className="text-sm font-medium text-foreground">Sin vehículos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">
              Agrega vehículos en el módulo de Transporte
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="tipo"
                  tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
                />
                <Bar dataKey="Disponibles" fill={AVAILABLE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="No disponibles" fill={UNAVAILABLE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
            <CustomLegend />
          </>
        )}
      </CardContent>
    </Card>
  )
}
