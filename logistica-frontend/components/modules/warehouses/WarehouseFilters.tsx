"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { WarehouseParams } from "@/types/warehouse"

interface WarehouseFiltersProps {
  params: WarehouseParams
  onParamsChange: (params: WarehouseParams) => void
}

export function WarehouseFilters({ params, onParamsChange }: WarehouseFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? "")

  // Debounce del campo search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsChange({ ...params, search: searchValue || undefined, page: 1 })
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  // Sincronizar cuando params.search cambia externamente (ej: limpiar filtros)
  useEffect(() => {
    if (!params.search) setSearchValue("")
  }, [params.search])

  function handleCityChange(e: React.ChangeEvent<HTMLInputElement>) {
    onParamsChange({ ...params, city: e.target.value || undefined, page: 1 })
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLInputElement>) {
    onParamsChange({ ...params, country: e.target.value || undefined, page: 1 })
  }

  function handleCapacityGteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    onParamsChange({
      ...params,
      capacity_m3_gte: value ? parseFloat(value) : undefined,
    })
  }

  function handleCapacityLteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    onParamsChange({
      ...params,
      capacity_m3_lte: value ? parseFloat(value) : undefined,
    })
  }

  function handleClearFilters() {
    setSearchValue("")
    onParamsChange({ page: 1 })
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[220px]">
        <Input
          placeholder="Buscar por nombre, ciudad o dirección..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[160px]">
        <Input
          placeholder="Filtrar por ciudad"
          value={params.city ?? ""}
          onChange={handleCityChange}
        />
      </div>

      <div className="min-w-[160px]">
        <Input
          placeholder="Filtrar por país"
          value={params.country ?? ""}
          onChange={handleCountryChange}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Capacidad m³
        </span>
        <Input
          type="number"
          placeholder="mín"
          className="w-24"
          value={params.capacity_m3_gte ?? ""}
          onChange={handleCapacityGteChange}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          placeholder="máx"
          className="w-24"
          value={params.capacity_m3_lte ?? ""}
          onChange={handleCapacityLteChange}
        />
      </div>

      <Button variant="outline" onClick={handleClearFilters}>
        Limpiar filtros
      </Button>
    </div>
  )
}
