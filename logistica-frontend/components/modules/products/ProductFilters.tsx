"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSupplierList } from "@/lib/hooks/use-suppliers"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { ProductParams } from "@/types/product"

interface ProductFiltersProps {
  params: ProductParams
  onParamsChange: (params: ProductParams) => void
}

export function ProductFilters({ params, onParamsChange }: ProductFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? "")

  const { data: suppliersData } = useSupplierList({ page: 1 })
  const { data: warehousesData } = useWarehouseList({ page: 1 })

  // Debounce del campo search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsChange({ ...params, search: searchValue || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  // Sincronizar cuando params.search cambia externamente
  useEffect(() => {
    if (!params.search) setSearchValue("")
  }, [params.search])

  function handleCategoryChange(e: React.ChangeEvent<HTMLInputElement>) {
    onParamsChange({ ...params, category: e.target.value || undefined, page: 1 })
  }

  function handleSupplierChange(value: string | null) {
    onParamsChange({
      ...params,
      supplier: !value || value === "all" ? undefined : Number(value),
      page: 1,
    })
  }

  function handleWarehouseChange(value: string | null) {
    onParamsChange({
      ...params,
      warehouse: !value || value === "all" ? undefined : Number(value),
      page: 1,
    })
  }

  function handleNumberChange(
    field: "unit_price_gte" | "unit_price_lte" | "stock_quantity_gte" | "stock_quantity_lte",
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const val = e.target.value
    onParamsChange({
      ...params,
      [field]: val ? Number(val) : undefined,
      page: 1,
    })
  }

  function handleOrderingChange(value: string | null) {
    onParamsChange({
      ...params,
      ordering: !value || value === "none" ? undefined : (value as ProductParams["ordering"]),
      page: 1,
    })
  }

  function handleClearFilters() {
    setSearchValue("")
    onParamsChange({ page: 1 })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[280px]">
          <Input
            placeholder="Buscar por nombre, SKU, categoría o descripción..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Categoría */}
        <div className="min-w-[160px]">
          <Input
            placeholder="Filtrar por categoría"
            value={params.category ?? ""}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Proveedor */}
        <div className="min-w-[180px]">
          <Select
            value={params.supplier !== undefined ? String(params.supplier) : "all"}
            onValueChange={handleSupplierChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder="Proveedor"
                label={
                  suppliersData?.results.find(
                    (s) => String(s.id) === String(params.supplier)
                  )?.name ?? (!params.supplier ? "Todos los proveedores" : "Cargando...")
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliersData?.results.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Almacén */}
        <div className="min-w-[180px]">
          <Select
            value={params.warehouse !== undefined ? String(params.warehouse) : "all"}
            onValueChange={handleWarehouseChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder="Almacén"
                label={
                  warehousesData?.results.find(
                    (w) => String(w.id) === String(params.warehouse)
                  )?.name ?? (!params.warehouse ? "Todos los almacenes" : "Cargando...")
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

        {/* Ordenamiento */}
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
                    name: "Nombre A-Z",
                    "-name": "Nombre Z-A",
                    unit_price: "Precio menor a mayor",
                    "-unit_price": "Precio mayor a menor",
                    stock_quantity: "Stock menor a mayor",
                    "-stock_quantity": "Stock mayor a menor",
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
              <SelectItem value="unit_price">Precio menor a mayor</SelectItem>
              <SelectItem value="-unit_price">Precio mayor a menor</SelectItem>
              <SelectItem value="stock_quantity">Stock menor a mayor</SelectItem>
              <SelectItem value="-stock_quantity">Stock mayor a menor</SelectItem>
              <SelectItem value="created_at">Más antiguos primero</SelectItem>
              <SelectItem value="-created_at">Más recientes primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleClearFilters}>
          Limpiar filtros
        </Button>
      </div>

      {/* Filtros de rango */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[140px]">
          <Input
            type="number"
            placeholder="Precio mínimo"
            value={params.unit_price_gte ?? ""}
            onChange={(e) => handleNumberChange("unit_price_gte", e)}
          />
        </div>
        <div className="min-w-[140px]">
          <Input
            type="number"
            placeholder="Precio máximo"
            value={params.unit_price_lte ?? ""}
            onChange={(e) => handleNumberChange("unit_price_lte", e)}
          />
        </div>
        <div className="min-w-[140px]">
          <Input
            type="number"
            placeholder="Stock mínimo"
            value={params.stock_quantity_gte ?? ""}
            onChange={(e) => handleNumberChange("stock_quantity_gte", e)}
          />
        </div>
        <div className="min-w-[140px]">
          <Input
            type="number"
            placeholder="Stock máximo"
            value={params.stock_quantity_lte ?? ""}
            onChange={(e) => handleNumberChange("stock_quantity_lte", e)}
          />
        </div>
      </div>
    </div>
  )
}
