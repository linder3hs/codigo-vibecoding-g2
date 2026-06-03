"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAssignUserGroups } from "@/lib/hooks/use-admin-users"
import { useAdminGroupList } from "@/lib/hooks/use-admin-groups"
import type { AdminUser } from "@/types/admin"

interface AssignGroupsDialogProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignGroupsDialog({ user, open, onOpenChange }: AssignGroupsDialogProps) {
  const { data: groupsData } = useAdminGroupList()
  const mutation = useAssignUserGroups()
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      setSelected(new Set(user.groups.map((g) => g.id)))
    }
  }, [open, user.groups])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    mutation.mutate(
      { userId: user.id, groupIds: Array.from(selected) },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const groups = groupsData?.results ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar grupos — {user.username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay grupos creados.</p>
          )}
          {groups.map((group) => (
            <label
              key={group.id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selected.has(group.id)}
                onCheckedChange={() => toggle(group.id)}
              />
              <span className="text-sm">{group.name}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
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
