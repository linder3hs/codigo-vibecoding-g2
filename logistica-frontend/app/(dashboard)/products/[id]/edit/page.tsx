"use client"

import { useRouter, useParams } from "next/navigation"
import { ProductForm } from "@/components/modules/products/ProductForm"
import { useProduct } from "@/lib/hooks/use-products"
import { Button } from "@/components/ui/button"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const { data: product, isPending, isError } = useProduct(id)

  if (isPending) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="text-center py-12">
          <p className="text-lg font-medium">Producto no encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            El producto que buscas no existe o fue eliminado.
          </p>
          <Button className="mt-4" onClick={() => router.push("/products")}>
            Volver a productos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Editar producto</h1>
        <p className="text-sm text-muted-foreground">{product.name} — SKU: {product.sku}</p>
      </div>

      <ProductForm
        product={product}
        onSuccess={() => router.push("/products")}
        onCancel={() => router.back()}
      />
    </div>
  )
}
