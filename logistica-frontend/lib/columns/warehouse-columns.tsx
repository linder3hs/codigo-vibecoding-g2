import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Warehouse } from "@/types/warehouse"

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getWarehouseColumns(
  onEdit: (warehouse: Warehouse) => void,
  onDelete: (warehouse: Warehouse) => void,
  perms: ColPerms = {}
): ColumnDef<Warehouse>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "city", header: "Ciudad" },
    { accessorKey: "country", header: "País" },
    {
      accessorKey: "capacity_m3",
      header: "Capacidad m³",
      cell: ({ row }) => {
        const raw = row.getValue<string>("capacity_m3")
        return `${parseFloat(raw).toLocaleString("es-CO")} m³`
      },
    },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Warehouse } }) => {
        const warehouse = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(warehouse)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(warehouse)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Warehouse>] : []),
  ]
}
