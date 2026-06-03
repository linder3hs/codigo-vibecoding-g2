"use client"

import { useRouter, usePathname } from "next/navigation"
import { LogOut, Menu, User, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { clearTokens, getUserFromToken } from "@/lib/auth"
import { useAuthStore } from "@/lib/store/auth"
import { useUIStore } from "@/lib/store/ui"
import { useMe } from "@/lib/hooks/use-me"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/warehouses": "Almacenes",
  "/suppliers": "Proveedores",
  "/customers": "Clientes",
  "/transport": "Transporte",
  "/products": "Productos",
  "/routes": "Rutas",
  "/drivers": "Conductores",
  "/shipments": "Envíos",
  "/profile": "Perfil",
  "/admin/users": "Usuarios",
  "/admin/groups": "Grupos / Roles",
}

function getPageTitle(pathname: string): string {
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return label
    }
  }
  return "Panel de control"
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const clear = useAuthStore((s) => s.clear)
  const { data: me } = useMe()

  const tokenUser = getUserFromToken()
  const displayName = me?.username ?? tokenUser?.username ?? "Usuario"
  const displayEmail = me?.email ?? ""
  const initials = displayName.slice(0, 2).toUpperCase()

  const pageTitle = getPageTitle(pathname)

  function handleLogout() {
    clear()
    router.push("/login")
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-background flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-sm text-foreground">
          {pageTitle}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menú de usuario"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-medium">{displayName}</span>
              {displayEmail && (
                <span className="text-xs text-muted-foreground">{displayEmail}</span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2 flex items-center gap-2.5">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{displayName}</span>
                {displayEmail ? (
                  <span className="text-xs text-muted-foreground truncate">{displayEmail}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">ID: {me?.id ?? tokenUser?.user_id ?? "—"}</span>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
