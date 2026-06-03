import type { ColumnDef, TableMeta } from "@tanstack/react-table"
import { Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Route } from "@/types/route"

interface RouteMeta extends TableMeta<Route> {
  warehouseMap: Record<number, string>
}

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getRouteColumns(
  onEdit: (route: Route) => void,
  onDelete: (route: Route) => void,
  onView?: (route: Route) => void,
  perms: ColPerms = {}
): ColumnDef<Route>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "name", header: "Nombre" },
    {
      accessorKey: "origin_warehouse",
      header: "Almacén origen",
      cell: ({ row, table }) => {
        const meta = table.options.meta as RouteMeta | undefined
        return meta?.warehouseMap[row.original.origin_warehouse] ?? `#${row.original.origin_warehouse}`
      },
    },
    {
      accessorKey: "estimated_distance_km",
      header: "Distancia (km)",
      cell: ({ row }) => `${parseFloat(row.original.estimated_distance_km).toFixed(2)} km`,
    },
    {
      accessorKey: "estimated_duration_hours",
      header: "Duración (horas)",
      cell: ({ row }) => `${parseFloat(row.original.estimated_duration_hours).toFixed(2)} h`,
    },
    ...(onView || canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Route } }) => {
        const route = row.original
        return (
          <div className="flex gap-2 justify-end">
            {onView && (
              <Button variant="ghost" size="sm" onClick={() => onView(route)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(route)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(route)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Route>] : []),
  ]
}
