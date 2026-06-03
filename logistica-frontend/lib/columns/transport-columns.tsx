import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Transport, TransportType } from "@/types/transport"

const transportTypeLabel: Record<TransportType, string> = {
  TRUCK: "Camión",
  VAN: "Van",
  MOTORCYCLE: "Moto",
  CARGO_BIKE: "Cargo Bike",
}

const transportTypeBadgeVariant: Record<TransportType, "default" | "secondary" | "outline" | "destructive"> = {
  TRUCK: "default",
  VAN: "secondary",
  MOTORCYCLE: "outline",
  CARGO_BIKE: "destructive",
}

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getTransportColumns(
  onEdit: (transport: Transport) => void,
  onDelete: (transport: Transport) => void,
  perms: ColPerms = {}
): ColumnDef<Transport>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "plate_number", header: "Placa" },
    {
      accessorKey: "transport_type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.transport_type
        return (
          <Badge variant={transportTypeBadgeVariant[type]}>
            {transportTypeLabel[type]}
          </Badge>
        )
      },
    },
    {
      id: "brand_model",
      header: "Marca / Modelo",
      cell: ({ row }) => `${row.original.brand} ${row.original.model}`,
    },
    { accessorKey: "capacity_kg", header: "Cap. (kg)" },
    {
      accessorKey: "is_available",
      header: "Disponibilidad",
      cell: ({ row }) => {
        const available = row.original.is_available
        return available ? (
          <Badge variant="default">Disponible</Badge>
        ) : (
          <Badge variant="destructive">No disponible</Badge>
        )
      },
    },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Transport } }) => {
        const transport = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(transport)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(transport)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Transport>] : []),
  ]
}
