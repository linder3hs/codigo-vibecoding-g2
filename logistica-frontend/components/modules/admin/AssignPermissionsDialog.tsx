"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"
import { useAssignGroupPermissions, usePermissionList } from "@/lib/hooks/use-admin-groups"
import type { AdminGroup } from "@/types/admin"

interface AssignPermissionsDialogProps {
  group: AdminGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignPermissionsDialog({ group, open, onOpenChange }: AssignPermissionsDialogProps) {
  const { data: permissionsData, isPending: loadingPerms } = usePermissionList()
  const mutation = useAssignGroupPermissions()

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) {
      setSelected(new Set(group.permissions.map((p) => p.id)))
      setSearch("")
    }
  }, [open, group.permissions])

  const allPermissions = permissionsData?.results ?? []

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? allPermissions.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.codename.toLowerCase().includes(q) ||
            p.app_label.toLowerCase().includes(q)
        )
      : allPermissions
  }, [allPermissions, search])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const p of filtered) {
      const key = p.app_label
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleApp(ids: number[]) {
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function handleSave() {
    mutation.mutate(
      { groupId: group.id, permissionIds: Array.from(selected) },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Permisos del grupo — {group.name}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar permiso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loadingPerms && (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando permisos...</p>
          )}
          {!loadingPerms && grouped.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin resultados.</p>
          )}
          {grouped.map(([appLabel, perms]) => {
            const permIds = perms.map((p) => p.id)
            const allSelected = permIds.every((id) => selected.has(id))
            const someSelected = permIds.some((id) => selected.has(id))

            return (
              <div key={appLabel} className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted">
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                    onCheckedChange={() => toggleApp(permIds)}
                    className="shrink-0"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {appLabel}
                  </span>
                </label>
                <div className="ml-6 space-y-0.5">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(perm.id)}
                        onCheckedChange={() => toggle(perm.id)}
                        className="shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm leading-tight">{perm.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{perm.codename}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="pt-2 border-t">
          <span className="text-xs text-muted-foreground mr-auto">
            {selected.size} permiso{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
