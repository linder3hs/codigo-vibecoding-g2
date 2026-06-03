"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useProductList } from "@/lib/hooks/use-products"

const STOCK_COLORS = {
  zero: "#ef4444",    // sin stock — rojo
  low: "#f97316",     // muy bajo (1-5) — naranja
  medium: "#f59e0b",  // bajo (6-threshold) — amarillo
}

function getColor(value: number, threshold: number): string {
  if (value === 0) return STOCK_COLORS.zero
  if (value <= Math.min(5, threshold * 0.3)) return STOCK_COLORS.low
  return STOCK_COLORS.medium
}

interface BarItemProps {
  name: string
  sku: string
  value: number
  max: number
  threshold: number
}

function BarItem({ name, sku, value, max, threshold }: BarItemProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const color = getColor(value, threshold)

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-shrink-0 w-36 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{sku}</p>
      </div>
      <div className="flex-1 h-5 rounded-md overflow-hidden bg-muted/50">
        <div
          className="h-full rounded-md transition-all duration-300"
          style={{
            width: value === 0 ? "100%" : `${Math.max(pct, 4)}%`,
            backgroundColor: value === 0 ? `${color}30` : color,
            opacity: 0.9,
          }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums flex-shrink-0 w-14 text-right"
        style={{ color }}
      >
        {value === 0 ? "Sin stock" : `${value} uds`}
      </span>
    </div>
  )
}

export function LowStockChart() {
  const [threshold, setThreshold] = useState(10)

  const { data, isPending } = useProductList({
    stock_quantity_lte: threshold,
    ordering: "stock_quantity",
    page: 1,
  })

  const products = (data?.results ?? []).slice(0, 10)
  const totalCritical = data?.count ?? 0
  const maxValue = products.length > 0
    ? Math.max(...products.map((p) => p.stock_quantity), 1)
    : 1
  const hasZeroStock = products.some((p) => p.stock_quantity === 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Stock crítico</CardTitle>
            {!isPending && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCritical > 0 ? (
                  <>
                    <span className="font-medium text-foreground">{totalCritical}</span> producto{totalCritical !== 1 ? "s" : ""} bajo umbral
                    {hasZeroStock && (
                      <span className="ml-1.5 font-medium" style={{ color: STOCK_COLORS.zero }}>
                        · {products.filter((p) => p.stock_quantity === 0).length} sin stock
                      </span>
                    )}
                  </>
                ) : (
                  "Inventario saludable"
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Umbral ≤</span>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 h-8 text-xs text-center"
              min={0}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2.5 mt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "#10b98120" }}
            >
              <span className="text-xl" role="img" aria-label="ok">✓</span>
            </div>
            <p className="text-sm font-medium" style={{ color: "#10b981" }}>¡Stock saludable!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ningún producto con stock ≤ {threshold}
            </p>
          </div>
        ) : (
          <>
            {/* Leyenda de colores */}
            <div className="flex gap-4 mb-3 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS.zero }} />
                <span className="text-xs text-muted-foreground">Sin stock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS.low }} />
                <span className="text-xs text-muted-foreground">Muy bajo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS.medium }} />
                <span className="text-xs text-muted-foreground">Bajo</span>
              </div>
            </div>

            <div className="space-y-0.5">
              {products.map((p) => (
                <BarItem
                  key={p.id}
                  name={p.name}
                  sku={p.sku}
                  value={p.stock_quantity}
                  max={maxValue}
                  threshold={threshold}
                />
              ))}
            </div>

            {totalCritical > 10 && (
              <p className="text-xs text-muted-foreground mt-3 text-right">
                +{totalCritical - 10} más con stock crítico
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
