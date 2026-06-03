"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ItemForm } from "@/components/modules/shipments/ItemForm"
import { DeleteShipmentItemDialog } from "@/components/modules/shipments/DeleteShipmentItemDialog"
import { useShipmentItems } from "@/lib/hooks/use-shipments"
import type { ShipmentItem } from "@/types/shipment"

interface ItemListProps {
  shipmentId: number
}

export function ItemList({ shipmentId }: ItemListProps) {
  const [showForm, setShowForm] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ShipmentItem | undefined>()

  const { data: items, isPending } = useShipmentItems(shipmentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ítems del envío</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar ítem
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
          No hay ítems en este envío
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Producto</th>
                <th className="text-left px-4 py-2 font-medium">SKU</th>
                <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                <th className="text-right px-4 py-2 font-medium">Precio unit.</th>
                <th className="text-right px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.product_name || `#${item.product}`}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.product_sku || "—"}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">${parseFloat(item.unit_price_at_time).toLocaleString("es-CO")}</td>
                  <td className="px-4 py-3 text-right font-medium">${parseFloat(item.subtotal).toLocaleString("es-CO")}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar ítem al envío</DialogTitle>
          </DialogHeader>
          <ItemForm
            shipmentId={shipmentId}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {deletingItem && (
        <DeleteShipmentItemDialog
          item={deletingItem}
          shipmentId={shipmentId}
          open={!!deletingItem}
          onOpenChange={(open) => { if (!open) setDeletingItem(undefined) }}
        />
      )}
    </div>
  )
}
