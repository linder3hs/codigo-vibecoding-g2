import Link from "next/link"
import { XCircle, ShoppingCart, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function CartCancelPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4">
              <XCircle className="h-12 w-12 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Pago cancelado</h1>
          <p className="text-muted-foreground text-sm mt-1">
            No se realizó ningún cargo
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />
          <p className="text-sm text-muted-foreground">
            Puedes volver al carrito en cualquier momento. Los productos que
            seleccionaste siguen guardados.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button render={<Link href="/cart" />} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Volver al carrito
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
