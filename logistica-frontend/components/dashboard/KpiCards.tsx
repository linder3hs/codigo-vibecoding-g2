"use client"

import { Package, Truck, Users, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useShipmentList } from "@/lib/hooks/use-shipments"
import { useDriverList } from "@/lib/hooks/use-drivers"
import { useTransportList } from "@/lib/hooks/use-transport"
import { useProductList } from "@/lib/hooks/use-products"
import { cn } from "@/lib/utils"

interface KpiConfig {
  label: string
  icon: React.ElementType
  accentClass: string
  iconBgClass: string
  iconColorClass: string
  valueColorClass: string
}

const configs: KpiConfig[] = [
  {
    label: "En tránsito",
    icon: Truck,
    accentClass: "border-t-4 border-t-orange-500",
    iconBgClass: "bg-orange-100 dark:bg-orange-950",
    iconColorClass: "text-orange-600 dark:text-orange-400",
    valueColorClass: "text-orange-600 dark:text-orange-400",
  },
  {
    label: "Pendientes",
    icon: Clock,
    accentClass: "border-t-4 border-t-yellow-500",
    iconBgClass: "bg-yellow-100 dark:bg-yellow-950",
    iconColorClass: "text-yellow-600 dark:text-yellow-400",
    valueColorClass: "text-yellow-600 dark:text-yellow-400",
  },
  {
    label: "Entregados",
    icon: CheckCircle2,
    accentClass: "border-t-4 border-t-emerald-500",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-950",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    valueColorClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Conductores activos",
    icon: Users,
    accentClass: "border-t-4 border-t-blue-500",
    iconBgClass: "bg-blue-100 dark:bg-blue-950",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    valueColorClass: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Flota disponible",
    icon: Package,
    accentClass: "border-t-4 border-t-violet-500",
    iconBgClass: "bg-violet-100 dark:bg-violet-950",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    valueColorClass: "text-violet-600 dark:text-violet-400",
  },
  {
    label: "Stock crítico",
    icon: AlertTriangle,
    accentClass: "border-t-4 border-t-red-500",
    iconBgClass: "bg-red-100 dark:bg-red-950",
    iconColorClass: "text-red-600 dark:text-red-400",
    valueColorClass: "text-red-600 dark:text-red-400",
  },
]

function KpiCard({
  label,
  value,
  icon: Icon,
  isLoading,
  accentClass,
  iconBgClass,
  iconColorClass,
  valueColorClass,
}: KpiConfig & { value: number | undefined; isLoading: boolean }) {
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", accentClass)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
              {label}
            </p>
            {isLoading ? (
              <div className="mt-2 h-7 w-14 bg-muted rounded animate-pulse" />
            ) : (
              <p className={cn("text-2xl font-bold mt-1.5 leading-none tabular-nums", valueColorClass)}>
                {value ?? "—"}
              </p>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconColorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiCards() {
  const { data: inTransit, isPending: l1 } = useShipmentList({ status: "IN_TRANSIT", page: 1 })
  const { data: pending, isPending: l2 } = useShipmentList({ status: "PENDING", page: 1 })
  const { data: delivered, isPending: l3 } = useShipmentList({ status: "DELIVERED", page: 1 })
  const { data: activeDrivers, isPending: l4 } = useDriverList({ is_active: true, page: 1 })
  const { data: availableTransport, isPending: l5 } = useTransportList({ is_available: true, page: 1 })
  const { data: lowStock, isPending: l6 } = useProductList({ stock_quantity_lte: 10, page: 1 })

  const values = [
    inTransit?.count,
    pending?.count,
    delivered?.count,
    activeDrivers?.count,
    availableTransport?.count,
    lowStock?.count,
  ]
  const loadings = [l1, l2, l3, l4, l5, l6]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {configs.map((cfg, i) => (
        <KpiCard
          key={cfg.label}
          {...cfg}
          value={values[i]}
          isLoading={loadings[i]}
        />
      ))}
    </div>
  )
}
