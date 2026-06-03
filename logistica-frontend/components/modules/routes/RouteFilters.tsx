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
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { RouteParams } from "@/types/route"

interface RouteFiltersProps {
  params: RouteParams
  onParamsChange: (params: RouteParams) => void
}

export function RouteFilters({ params, onParamsChange }: RouteFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? "")
  const { data: warehousesData } = useWarehouseList({ page: 1 })

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

  function handleWarehouseChange(value: string | null) {
    onParamsChange({
      ...params,
      origin_warehouse: !value || value === "all" ? undefined : Number(value),
      page: 1,
    })
  }

  function handleOrderingChange(value: string | null) {
    onParamsChange({
      ...params,
      ordering: !value || value === "none" ? undefined : (value as RouteParams["ordering"]),
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
          placeholder="Buscar por nombre..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[200px]">
        <Select
          value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : "all"}
          onValueChange={handleWarehouseChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Almacén origen"
              label={
                warehousesData?.results.find(
                  (w) => String(w.id) === String(params.origin_warehouse)
                )?.name ?? (!params.origin_warehouse ? "Todos los almacenes" : "Cargando...")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los almacenes</SelectItem>
            {warehousesData?.results.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[220px]">
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
                  name: "Nombre A-Z",
                  "-name": "Nombre Z-A",
                  estimated_distance_km: "Distancia menor a mayor",
                  "-estimated_distance_km": "Distancia mayor a menor",
                  estimated_duration_hours: "Duración menor a mayor",
                  "-estimated_duration_hours": "Duración mayor a menor",
                  created_at: "Más antiguos primero",
                  "-created_at": "Más recientes primero",
                } as Record<string, string>)[params.ordering ?? "none"]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin orden específico</SelectItem>
            <SelectItem value="name">Nombre A-Z</SelectItem>
            <SelectItem value="-name">Nombre Z-A</SelectItem>
            <SelectItem value="estimated_distance_km">Distancia menor a mayor</SelectItem>
            <SelectItem value="-estimated_distance_km">Distancia mayor a menor</SelectItem>
            <SelectItem value="estimated_duration_hours">Duración menor a mayor</SelectItem>
            <SelectItem value="-estimated_duration_hours">Duración mayor a menor</SelectItem>
            <SelectItem value="created_at">Más antiguos primero</SelectItem>
            <SelectItem value="-created_at">Más recientes primero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={handleClear}>
        Limpiar filtros
      </Button>
    </div>
  )
}
