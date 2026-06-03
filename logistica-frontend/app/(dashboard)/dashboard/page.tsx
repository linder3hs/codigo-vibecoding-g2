"use client"

import { KpiCards } from "@/components/dashboard/KpiCards"
import { ShipmentStatusChart } from "@/components/dashboard/ShipmentStatusChart"
import { FleetAvailabilityChart } from "@/components/dashboard/FleetAvailabilityChart"
import { TopCitiesChart } from "@/components/dashboard/TopCitiesChart"
import { LowStockChart } from "@/components/dashboard/LowStockChart"
import { TransportTypeChart } from "@/components/dashboard/TransportTypeChart"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visión general del sistema logístico en tiempo real
        </p>
      </div>

      {/* KPIs */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Indicadores clave
        </h2>
        <KpiCards />
      </section>

      {/* Fila 1: Estado envíos + Disponibilidad flota */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Envíos y flota
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ShipmentStatusChart />
          <FleetAvailabilityChart />
        </div>
      </section>

      {/* Fila 2: Top ciudades + Stock crítico */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Destinos e inventario
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopCitiesChart />
          <LowStockChart />
        </div>
      </section>

      {/* Fila 3: Flota por tipo */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Composición de flota
        </h2>
        <TransportTypeChart />
      </section>
    </div>
  )
}
