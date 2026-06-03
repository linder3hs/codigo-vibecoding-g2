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
import type { CustomerParams, CustomerType } from "@/types/customer"

interface CustomerFiltersProps {
  params: CustomerParams
  onParamsChange: (params: CustomerParams) => void
}

export function CustomerFilters({ params, onParamsChange }: CustomerFiltersProps) {
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

  function handleCustomerTypeChange(value: string | null) {
    if (!value || value === "all") {
      onParamsChange({ ...params, customer_type: undefined, page: 1 })
    } else {
      onParamsChange({ ...params, customer_type: value as CustomerType, page: 1 })
    }
  }

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
          placeholder="Buscar por nombre, email o NIT..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          value={params.customer_type ?? "all"}
          onValueChange={handleCustomerTypeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Tipo de cliente"
              label={
                { all: "Todos los tipos", COMPANY: "Empresa", INDIVIDUAL: "Persona" }[
                  params.customer_type ?? "all"
                ]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="COMPANY">Empresa</SelectItem>
            <SelectItem value="INDIVIDUAL">Persona</SelectItem>
          </SelectContent>
        </Select>
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
