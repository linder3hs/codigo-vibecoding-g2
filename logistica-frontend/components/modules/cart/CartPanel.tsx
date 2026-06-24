"use client"

import Image from "next/image"
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Loader2, Package, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart"
import { useCheckout } from "@/lib/hooks/use-checkout"
import type { CartItem } from "@/types/payment"

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    typeof value === "string" ? parseFloat(value) : value
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore()
  const subtotal = parseFloat(item.unit_price) * item.quantity

  return (
    <div className="flex gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="48px" />
        ) : (
          <Package className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(item.unit_price)} c/u</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
          >
            <Minus className="h-2.5 w-2.5" />
          </Button>
          <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            disabled={item.quantity >= item.stock_quantity}
            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between shrink-0">
        <p className="text-sm font-bold">{formatPrice(subtotal)}</p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => removeItem(item.product_id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

interface CartPanelProps {
  className?: string
}

export function CartPanel({ className }: CartPanelProps) {
  const { items, clearCart } = useCartStore()
  const { mutate: checkout, isPending, error } = useCheckout()

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0)

  function handleCheckout() {
    checkout({
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    })
  }

  return (
    <Card className={`flex flex-col ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          Mi carrito
          {totalItems > 0 && (
            <Badge className="ml-auto">{totalItems}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Tu carrito está vacío</p>
            <p className="text-xs text-muted-foreground/70">
              Agrega productos del catálogo para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemRow key={item.product_id} item={item} />
            ))}
          </div>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardFooter className="flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
          </div>

          {error && (
            <p className="text-xs text-destructive w-full">
              {(error as Error).message || "Error al procesar el pago"}
            </p>
          )}

          <Separator />

          <Button className="w-full" onClick={handleCheckout} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {isPending ? "Redirigiendo..." : "Ir al pago"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={clearCart}
            disabled={isPending}
          >
            Vaciar carrito
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
