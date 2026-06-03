import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminGroup } from "@/types/admin"

export function getAdminGroupColumns(
  onEdit: (group: AdminGroup) => void,
  onDelete: (group: AdminGroup) => void,
  onAssignPermissions: (group: AdminGroup) => void
): ColumnDef<AdminGroup>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre del grupo",
    },
    {
      accessorKey: "permissions",
      header: "Permisos",
      cell: ({ row }) => {
        const count = row.original.permissions.length
        return count > 0 ? (
          <Badge variant="secondary">{count} permiso{count !== 1 ? "s" : ""}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Sin permisos</span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const group = row.original
        return (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAssignPermissions(group)}
              title="Gestionar permisos"
            >
              <ShieldCheck className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(group)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
