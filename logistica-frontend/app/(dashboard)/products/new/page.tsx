"use client"

import { useRouter } from "next/navigation"
import { ProductForm } from "@/components/modules/products/ProductForm"

export default function NewProductPage() {
  const router = useRouter()

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">Completa los datos del nuevo producto</p>
      </div>

      <ProductForm
        onSuccess={() => router.push("/products")}
        onCancel={() => router.back()}
      />
    </div>
  )
}
