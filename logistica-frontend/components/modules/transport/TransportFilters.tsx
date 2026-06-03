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
import type { TransportParams, TransportType } from "@/types/transport"

interface TransportFiltersProps {
  params: TransportParams
  onParamsChange: (params: TransportParams) => void
}

export function TransportFilters({ params, onParamsChange }: TransportFiltersProps) {
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

  function handleTransportTypeChange(value: string | null) {
    if (!value || value === "all") {
      onParamsChange({ ...params, transport_type: undefined, page: 1 })
    } else {
      onParamsChange({ ...params, transport_type: value as TransportType, page: 1 })
    }
  }

  function handleIsAvailableChange(value: string | null) {
    if (!value || value === "all") {
      onParamsChange({ ...params, is_available: undefined, page: 1 })
    } else {
      onParamsChange({ ...params, is_available: value === "true", page: 1 })
    }
  }

  function handleCapacityKgGteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onParamsChange({
      ...params,
      capacity_kg_gte: val ? Number(val) : undefined,
      page: 1,
    })
  }

  function handleCapacityKgLteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onParamsChange({
      ...params,
      capacity_kg_lte: val ? Number(val) : undefined,
      page: 1,
    })
  }

  function handleClearFilters() {
    setSearchValue("")
    onParamsChange({ page: 1 })
  }

  const isAvailableValue =
    params.is_available === undefined ? "all" : params.is_available ? "true" : "false"

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[280px]">
        <Input
          placeholder="Buscar por placa, marca o modelo..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          value={params.transport_type ?? "all"}
          onValueChange={handleTransportTypeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Tipo de transporte"
              label={
                {
                  all: "Todos los tipos",
                  TRUCK: "Camión",
                  VAN: "Van",
                  MOTORCYCLE: "Moto",
                  CARGO_BIKE: "Cargo Bike",
                }[params.transport_type ?? "all"]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="TRUCK">Camión</SelectItem>
            <SelectItem value="VAN">Van</SelectItem>
            <SelectItem value="MOTORCYCLE">Moto</SelectItem>
            <SelectItem value="CARGO_BIKE">Cargo Bike</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <Select value={isAvailableValue} onValueChange={handleIsAvailableChange}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Disponibilidad"
              label={
                { all: "Todos", true: "Disponible", false: "No disponible" }[isAvailableValue]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Disponible</SelectItem>
            <SelectItem value="false">No disponible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px]">
        <Input
          type="number"
          placeholder="Cap. mín. (kg)"
          value={params.capacity_kg_gte ?? ""}
          onChange={handleCapacityKgGteChange}
        />
      </div>

      <div className="min-w-[140px]">
        <Input
          type="number"
          placeholder="Cap. máx. (kg)"
          value={params.capacity_kg_lte ?? ""}
          onChange={handleCapacityKgLteChange}
        />
      </div>

      <Button variant="outline" onClick={handleClearFilters}>
        Limpiar filtros
      </Button>
    </div>
  )
}
