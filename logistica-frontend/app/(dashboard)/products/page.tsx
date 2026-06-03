"use client"

import { usePermissions } from "@/lib/hooks/use-permissions"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type PaginationState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { FiltersSheet } from "@/components/ui/filters-sheet"
import { countActiveFilters } from "@/lib/utils/filters"
import { ProductFilters } from "@/components/modules/products/ProductFilters"
import { ProductTable } from "@/components/modules/products/ProductTable"
import { DeleteProductDialog } from "@/components/modules/products/DeleteProductDialog"
import { useProductList } from "@/lib/hooks/use-products"
import type { Product, ProductParams } from "@/types/product"

export default function ProductsPage() {
  const { canAdd, canChange, canDelete } = usePermissions()
  const router = useRouter()

  const [params, setParams] = useState<ProductParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [deleting, setDeleting] = useState<Product | undefined>()

  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useProductList(params)

  function handleParamsChange(newParams: ProductParams) {
    setParams(newParams)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestión de catálogo de productos</p>
        </div>
        {canAdd('product') && (
          <Button onClick={() => router.push("/products/new")}>Nuevo producto</Button>
        )}
      </div>

      <FiltersSheet activeCount={countActiveFilters(params as Record<string, unknown>)} title="Filtros">
        <ProductFilters params={params} onParamsChange={handleParamsChange} />
      </FiltersSheet>

      <ProductTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={(product) => router.push(`/products/${product.id}/edit`)}
        onDelete={(product) => setDeleting(product)}
        perms={{ canChange: canChange('product'), canDelete: canDelete('product') }}
      />

      {deleting && (
        <DeleteProductDialog
          product={deleting}
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(undefined)}
        />
      )}
    </div>
  )
}
