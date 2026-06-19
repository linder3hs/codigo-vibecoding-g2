import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductThumb } from "@/components/modules/products/ProductThumb"
import type { Product } from "@/types/product"

interface ColPerms { canChange?: boolean; canDelete?: boolean }

export function getProductColumns(
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void,
  perms: ColPerms = {}
): ColumnDef<Product>[] {
  const { canChange = true, canDelete = true } = perms
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <ProductThumb
          src={row.original.image_url}
          alt={row.original.name}
          className="h-10 w-10"
        />
      ),
    },
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Categoría" },
    {
      accessorKey: "supplier",
      header: "Proveedor",
      cell: ({ row }) => `#${row.original.supplier}`,
    },
    {
      accessorKey: "warehouse",
      header: "Almacén",
      cell: ({ row }) => `#${row.original.warehouse}`,
    },
    {
      accessorKey: "unit_price",
      header: "Precio unitario",
      cell: ({ row }) =>
        `$${parseFloat(row.original.unit_price).toLocaleString("es-CO")}`,
    },
    { accessorKey: "stock_quantity", header: "Stock" },
    ...(canChange || canDelete ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Product } }) => {
        const product = row.original
        return (
          <div className="flex gap-2 justify-end">
            {canChange && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(product)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    } as ColumnDef<Product>] : []),
  ]
}
