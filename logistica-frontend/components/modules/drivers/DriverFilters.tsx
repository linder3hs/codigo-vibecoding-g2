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
import { useTransportList } from "@/lib/hooks/use-transport"
import type { DriverParams } from "@/types/driver"

interface DriverFiltersProps {
  params: DriverParams
  onParamsChange: (params: DriverParams) => void
}

export function DriverFilters({ params, onParamsChange }: DriverFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? "")
  const { data: transportData } = useTransportList({ page: 1 })

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

  function handleIsActiveChange(value: string | null) {
    onParamsChange({
      ...params,
      is_active: !value || value === "all" ? undefined : value === "true",
      page: 1,
    })
  }

  function handleTransportChange(value: string | null) {
    onParamsChange({
      ...params,
      transport: !value || value === "all" ? undefined : Number(value),
      page: 1,
    })
  }

  function handleOrderingChange(value: string | null) {
    onParamsChange({
      ...params,
      ordering: !value || value === "none" ? undefined : (value as DriverParams["ordering"]),
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
          placeholder="Buscar por nombre, licencia, teléfono, email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="min-w-[160px]">
        <Select
          value={params.is_active !== undefined ? String(params.is_active) : "all"}
          onValueChange={handleIsActiveChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Estado"
              label={
                { all: "Todos", true: "Activo", false: "Inactivo" }[
                  params.is_active !== undefined ? String(params.is_active) : "all"
                ]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activo</SelectItem>
            <SelectItem value="false">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[200px]">
        <Select
          value={params.transport !== undefined ? String(params.transport) : "all"}
          onValueChange={handleTransportChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder="Transporte"
              label={(() => {
                const found = transportData?.results.find(
                  (t) => String(t.id) === String(params.transport)
                )
                return found
                  ? `${found.plate_number} — ${found.brand} ${found.model}`
                  : !params.transport
                    ? "Todos los transportes"
                    : "Cargando..."
              })()}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los transportes</SelectItem>
            {transportData?.results.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.plate_number} — {t.brand} {t.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  license_expiry: "Vencimiento asc",
                  "-license_expiry": "Vencimiento desc",
                  created_at: "Más antiguos primero",
                  "-created_at": "Más recientes primero",
                } as Record<string, string>)[params.ordering ?? "none"]
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin orden específico</SelectItem>
            <SelectItem value="license_expiry">Vencimiento asc</SelectItem>
            <SelectItem value="-license_expiry">Vencimiento desc</SelectItem>
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
