import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Shipment, ShipmentStatus } from "@/types/shipment"

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  RETURNED: "Devuelto",
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" })

function StatusBadge({ status }: { status: ShipmentStatus }) {
  if (status === "PENDING") return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
  if (status === "CONFIRMED") return <Badge variant="default">{STATUS_LABELS[status]}</Badge>
  if (status === "CANCELLED") return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>
  if (status === "IN_TRANSIT")
    return <Badge variant="outline" className="text-orange-600 border-orange-600">{STATUS_LABELS[status]}</Badge>
  if (status === "DELIVERED")
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{STATUS_LABELS[status]}</Badge>
  if (status === "RETURNED")
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{STATUS_LABELS[status]}</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

interface ColPerms { canChange?: boolean }

export function getShipmentColumns(
  onEdit: (shipment: Shipment) => void,
  onView: (shipment: Shipment) => void,
  perms: ColPerms = {}
): ColumnDef<Shipment>[] {
  const { canChange = true } = perms
  return [
    {
      accessorKey: "tracking_number",
      header: "Tracking",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Cliente",
      cell: ({ row }) => row.original.customer_name || `#${row.original.customer}`,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => <StatusBadge status={getValue<ShipmentStatus>()} />,
    },
    { accessorKey: "destination_city", header: "Ciudad destino" },
    {
      accessorKey: "estimated_delivery_date",
      header: "Entrega estimada",
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        if (!value) return "—"
        const [year, month, day] = value.split("-").map(Number)
        return dateFormatter.format(new Date(year, month - 1, day))
      },
    },
    {
      accessorKey: "calculated_cost",
      header: "Costo",
      cell: ({ getValue }) => `$${parseFloat(getValue<string>()).toLocaleString("es-CO")}`,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => onView(shipment)}>
              <Eye className="h-4 w-4" />
            </Button>
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(shipment)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
