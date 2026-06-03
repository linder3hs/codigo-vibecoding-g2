"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_LABELS } from "@/lib/columns/shipment-columns"
import type { ShipmentParams, ShipmentStatus } from "@/types/shipment"

const ALL_STATUSES: ShipmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]

interface ShipmentFiltersProps {
  params: ShipmentParams
  onParamsChange: (params: ShipmentParams) => void
}

export function ShipmentFilters({ params, onParamsChange }: ShipmentFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? "")

  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsChange({ ...params, search: searchValue || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  useEffect(() => {
    if (!params.search) setSearchValue("")
  }, [params.search])

  function handleStatusChange(value: string | null) {
    onParamsChange({
      ...params,
      status: !value || value === "all" ? undefined : (value as ShipmentStatus),
      page: 1,
    })
  }

  function handleCityChange(e: React.ChangeEvent<HTMLInputElement>) {
    onParamsChange({
      ...params,
      destination_city: e.target.value || undefined,
      page: 1,
    })
  }

  function handleOrderingChange(value: string | null) {
    onParamsChange({
      ...params,
      ordering: !value || value === "none" ? undefined : (value as ShipmentParams["ordering"]),
      page: 1,
    })
  }

  function handleClear() {
    setSearchValue("")
    onParamsChange({ page: 1 })
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[280px]">
        <Input
          placeholder="Buscar por tracking, dirección o ciudad..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          value={params.status ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Estado"
              label={
                params.status
                  ? STATUS_LABELS[params.status]
                  : "Todos los estados"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <Input
          placeholder="Ciudad destino"
          value={params.destination_city ?? ""}
          onChange={handleCityChange}
        />
      </div>

      <div className="min-w-[200px]">
        <Select
          value={params.ordering ?? "none"}
          onValueChange={handleOrderingChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Ordenar por..."
              label={
                ({
                  none: "Sin orden específico",
                  "-created_at": "Más recientes primero",
                  created_at: "Más antiguos primero",
                  estimated_delivery_date: "Entrega asc",
                  "-estimated_delivery_date": "Entrega desc",
                  "-calculated_cost": "Costo mayor a menor",
                  calculated_cost: "Costo menor a mayor",
                } as Record<string, string>)[params.ordering ?? "none"]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin orden específico</SelectItem>
            <SelectItem value="-created_at">Más recientes primero</SelectItem>
            <SelectItem value="created_at">Más antiguos primero</SelectItem>
            <SelectItem value="estimated_delivery_date">Entrega asc</SelectItem>
            <SelectItem value="-estimated_delivery_date">Entrega desc</SelectItem>
            <SelectItem value="-calculated_cost">Costo mayor a menor</SelectItem>
            <SelectItem value="calculated_cost">Costo menor a mayor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={handleClear}>
        Limpiar filtros
      </Button>
    </div>
  )
}
