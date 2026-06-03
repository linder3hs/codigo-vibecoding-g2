import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Supplier } from "@/types/supplier"

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getSupplierColumns(
  onEdit: (supplier: Supplier) => void,
  onDelete: (supplier: Supplier) => void,
  perms: ColPerms = {}
): ColumnDef<Supplier>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "name", header: "Proveedor" },
    { accessorKey: "contact_name", header: "Contacto" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "city", header: "Ciudad" },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Supplier } }) => {
        const supplier = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(supplier)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(supplier)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Supplier>] : []),
  ]
}
