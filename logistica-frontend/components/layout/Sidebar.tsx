"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Warehouse,
  Building2,
  Users,
  Truck,
  Package,
  Route,
  UserCheck,
  PackageCheck,
  X,
  UserCog,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/store/ui"
import { usePermissions } from "@/lib/hooks/use-permissions"

const navGroups = [
  {
    label: "General",
    superAdminOnly: false,
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, model: null },
    ],
  },
  {
    label: "Infraestructura",
    superAdminOnly: false,
    links: [
      { label: "Almacenes", href: "/warehouses", icon: Warehouse, model: "warehouse" },
      { label: "Proveedores", href: "/suppliers", icon: Building2, model: "supplier" },
      { label: "Clientes", href: "/customers", icon: Users, model: "customer" },
    ],
  },
  {
    label: "Operaciones",
    superAdminOnly: false,
    links: [
      { label: "Transporte", href: "/transport", icon: Truck, model: "transport" },
      { label: "Conductores", href: "/drivers", icon: UserCheck, model: "driver" },
      { label: "Rutas", href: "/routes", icon: Route, model: "route" },
    ],
  },
  {
    label: "Logística",
    superAdminOnly: false,
    links: [
      { label: "Productos", href: "/products", icon: Package, model: "product" },
      { label: "Envíos", href: "/shipments", icon: PackageCheck, model: "shipment" },
    ],
  },
  {
    label: "Administración",
    superAdminOnly: true,
    links: [
      { label: "Usuarios", href: "/admin/users", icon: UserCog, model: null },
      { label: "Roles / Grupos", href: "/admin/groups", icon: ShieldCheck, model: null },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { canView, isSuperAdmin, isLoading } = usePermissions()

  function handleLinkClick() {
    setSidebarOpen(false)
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)
  }

  const visibleGroups = navGroups
    .filter((g) => !g.superAdminOnly || isSuperAdmin)
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => !l.model || isLoading || canView(l.model)),
    }))
    .filter((g) => g.links.length > 0)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:z-auto"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
            Logística
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
              {group.label}
            </p>
            {group.links.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer",
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
