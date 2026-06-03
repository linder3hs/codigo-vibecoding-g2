"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface FiltersSheetProps {
  children: React.ReactNode
  activeCount?: number
  title?: string
}

/**
 * Mobile: Sheet desde la izquierda con layout vertical forzado.
 * Desktop: Card inline con los filtros en fila.
 */
export function FiltersSheet({ children, activeCount = 0, title = "Filtros" }: FiltersSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile: botón + Sheet izquierda */}
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2 h-9 cursor-pointer">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtros</span>
                {activeCount > 0 && (
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            }
          />

          <SheetContent side="left" className="w-80 flex flex-col p-0">
            <SheetHeader className="px-5 py-4 border-b shrink-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {title}
                {activeCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {activeCount} activo{activeCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            {/* Layout vertical forzado sobre los hijos sin modificar cada filtro */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div
                className={[
                  "[&>div]:flex-col",
                  "[&>div>div]:w-full",
                  "[&>div>div]:min-w-0",
                  "[&>div>button]:w-full",
                  "[&>div>button]:justify-start",
                  "flex flex-col gap-5",
                ].join(" ")}
              >
                {children}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {activeCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {activeCount} filtro{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Desktop: Card con filtros inline */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="py-3">
            {children}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
