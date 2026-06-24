"use client"

import Image from "next/image"
import { ShoppingCart, Plus, Minus, Package } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart"
import type { Product } from "@/types/product"

function formatPrice(value: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    parseFloat(value)
  )
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find((i) => i.product_id === product.id)
  const canBuy = !!product.stripe_price_id && product.stock_quantity > 0

  function handleAdd() {
    if (!product.stripe_price_id) return
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      unit_price: product.unit_price,
      image_url: product.image_url,
      stripe_price_id: product.stripe_price_id,
      stock_quantity: product.stock_quantity,
    })
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground/40" />
        )}
        {!product.stripe_price_id && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Sin precio Stripe</Badge>
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">Sin stock</Badge>
          </div>
        )}
      </div>

      <CardContent className="flex-1 p-3 space-y-1.5">
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
          {product.category}
        </Badge>
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-[11px] text-muted-foreground font-mono">{product.sku}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-base">{formatPrice(product.unit_price)}</span>
          <span className="text-[11px] text-muted-foreground">
            {product.stock_quantity} en stock
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        {cartItem ? (
          <div className="flex items-center gap-2 w-full">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="flex-1 text-center text-sm font-semibold">{cartItem.quantity}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              disabled={cartItem.quantity >= product.stock_quantity}
              onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            disabled={!canBuy}
            onClick={handleAdd}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {!product.stripe_price_id ? "No disponible" : "Agregar"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
