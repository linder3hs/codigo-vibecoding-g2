import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Driver } from "@/types/driver"

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "short" })

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getDriverColumns(
  onEdit: (driver: Driver) => void,
  onDelete: (driver: Driver) => void,
  perms: ColPerms = {}
): ColumnDef<Driver>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "user_full_name", header: "Conductor" },
    { accessorKey: "user_email", header: "Email" },
    { accessorKey: "license_number", header: "Licencia" },
    {
      accessorKey: "license_expiry",
      header: "Vence",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        if (!value) return "—"
        const [year, month, day] = value.split("-").map(Number)
        return dateFormatter.format(new Date(year, month - 1, day))
      },
    },
    {
      accessorKey: "transport",
      header: "Transporte",
      cell: ({ getValue }) => {
        const value = getValue<number | null>()
        return value !== null ? `#${value}` : "—"
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Driver } }) => {
        const driver = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(driver)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(driver)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Driver>] : []),
  ]
}
