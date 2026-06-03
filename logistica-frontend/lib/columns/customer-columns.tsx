import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/types/customer"

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getCustomerColumns(
  onEdit: (customer: Customer) => void,
  onDelete: (customer: Customer) => void,
  perms: ColPerms = {}
): ColumnDef<Customer>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    { accessorKey: "name", header: "Cliente" },
    {
      accessorKey: "customer_type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.customer_type
        return type === "COMPANY" ? (
          <Badge variant="default">Empresa</Badge>
        ) : (
          <Badge variant="secondary">Persona</Badge>
        )
      },
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "city", header: "Ciudad" },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(customer)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Customer>] : []),
  ]
}
