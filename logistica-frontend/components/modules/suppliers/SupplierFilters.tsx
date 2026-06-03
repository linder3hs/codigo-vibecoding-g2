"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { SupplierParams } from "@/types/supplier"

interface SupplierFiltersProps {
  params: SupplierParams
  onParamsChange: (params: SupplierParams) => void
}

export function SupplierFilters({ params, onParamsChange }: SupplierFiltersProps) {
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

  function handleClearFilters() {
    setSearchValue("")
    onParamsChange({ page: 1 })
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[280px]">
        <Input
          placeholder="Buscar por nombre, contacto, email o NIT..."
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

      <Button variant="outline" onClick={handleClearFilters}>
        Limpiar filtros
      </Button>
    </div>
  )
}
