"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ShoppingCart, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/store/cart"

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get("session_id")
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">¡Pago exitoso!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tu pedido ha sido procesado correctamente
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessionId && (
            <div className="rounded-lg bg-muted px-4 py-3 text-left">
              <p className="text-xs text-muted-foreground mb-0.5">ID de sesión</p>
              <p className="text-xs font-mono break-all">{sessionId}</p>
            </div>
          )}
          <Separator />
          <p className="text-sm text-muted-foreground">
            El estado se actualiza automáticamente vía webhook de Stripe.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button render={<Link href="/cart" />} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Seguir comprando
          </Button>
          <Button
            render={<Link href="/dashboard" />}
            variant="outline"
            className="w-full"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Ir al dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function CartSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
