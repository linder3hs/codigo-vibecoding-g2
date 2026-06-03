import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Shield, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminUser } from "@/types/admin"

export function getAdminUserColumns(
  onEdit: (user: AdminUser) => void,
  onDelete: (user: AdminUser) => void,
  onAssignGroups: (user: AdminUser) => void
): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "username",
      header: "Usuario",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "is_superuser",
      header: "Rol",
      cell: ({ row }) =>
        row.original.is_superuser ? (
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Superadmin
          </Badge>
        ) : (
          <Badge variant="secondary">Usuario</Badge>
        ),
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="outline" className="text-green-700 border-green-300">Activo</Badge>
        ) : (
          <Badge variant="outline" className="text-red-700 border-red-300">Inactivo</Badge>
        ),
    },
    {
      accessorKey: "groups",
      header: "Grupos",
      cell: ({ row }) => {
        const groups = row.original.groups
        if (!groups.length) return <span className="text-muted-foreground text-xs">Sin grupos</span>
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <Badge key={g.id} variant="outline" className="text-xs">{g.name}</Badge>
            ))}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => onAssignGroups(user)} title="Asignar grupos">
              <UserCheck className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(user)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
