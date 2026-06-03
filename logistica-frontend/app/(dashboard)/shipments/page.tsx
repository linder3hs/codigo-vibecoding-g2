"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"
import { ShipmentFilters } from "@/components/modules/shipments/ShipmentFilters"
import { ShipmentTable } from "@/components/modules/shipments/ShipmentTable"
import { useShipmentList } from "@/lib/hooks/use-shipments"
import type { ShipmentParams } from "@/types/shipment"

export default function ShipmentsPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const router = useRouter()

  const [params, setParams] = useState<ShipmentParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useShipmentList(params)

  function handleParamsChange(newParams: ShipmentParams) {
    setParams(newParams)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Envíos</h1>
          <p className="text-muted-foreground">Gestiona los envíos y su seguimiento</p>
        </div>
        {canAdd('shipment') && (
          <Button onClick={() => router.push("/shipments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo envío
          </Button>
        )}
      </div>

      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <ShipmentFilters params={params} onParamsChange={handleParamsChange} />
      </FiltersSheet>

      <ShipmentTable
        data={data}
        perms={{ canChange: canChange('shipment') }}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  )
}
