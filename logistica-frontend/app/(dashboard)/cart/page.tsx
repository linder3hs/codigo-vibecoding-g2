"use client"

import { useState } from "react"
import { ShoppingCart, Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductCard } from "@/components/modules/cart/ProductCard"
import { CartPanel } from "@/components/modules/cart/CartPanel"
import { useProductList } from "@/lib/hooks/use-products"
import { useCartStore } from "@/lib/store/cart"

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <CardContent className="p-3 space-y-2">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-full rounded bg-muted mt-1" />
      </CardContent>
    </Card>
  )
}

export default function CartPage() {
  const [search, setSearch] = useState("")
  const [ordering, setOrdering] = useState("")
  const [page, setPage] = useState(1)

  const params = {
    page,
    ...(search && { search }),
    ...(ordering && { ordering: ordering as "unit_price" | "-unit_price" | "-created_at" }),
    stock_quantity_gte: 0,
  }

  const { data, isPending } = useProductList(params)
  const items = useCartStore((s) => s.items)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tienda</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.count} productos disponibles` : "Cargando catálogo..."}
          </p>
        </div>

        {/* Mobile cart button */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" className="relative lg:hidden">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Mi carrito
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col" showCloseButton={false}>
            <CartPanel className="flex-1 border-0 rounded-none shadow-none h-full" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, SKU..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={ordering}
          onValueChange={(v) => {
            setOrdering(v ?? "")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unit_price">Precio: menor a mayor</SelectItem>
            <SelectItem value="-unit_price">Precio: mayor a menor</SelectItem>
            <SelectItem value="-created_at">Más recientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Product grid */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-6">
          {isPending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : !data || data.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No se encontraron productos</p>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => handleSearch("")}>
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {data.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {(data.next || data.previous) && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.previous}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">Página {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.next}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop cart panel — sticky */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 shrink-0">
          <div className="sticky top-0 w-full self-start max-h-[calc(100vh-8rem)] flex flex-col">
            <CartPanel className="flex-1 overflow-hidden" />
          </div>
        </div>
      </div>
    </div>
  )
}
