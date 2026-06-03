"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAdminGroupList } from "@/lib/hooks/use-admin-groups"
import { useAuthStore } from "@/lib/store/auth"
import type { AdminGroup } from "@/types/admin"
import { GroupTable } from "@/components/modules/admin/GroupTable"
import { GroupForm } from "@/components/modules/admin/GroupForm"
import { DeleteGroupDialog } from "@/components/modules/admin/DeleteGroupDialog"
import { AssignPermissionsDialog } from "@/components/modules/admin/AssignPermissionsDialog"

export default function AdminGroupsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user !== null && !user.is_superuser) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminGroup | undefined>()
  const [deleting, setDeleting] = useState<AdminGroup | undefined>()
  const [assigningPerms, setAssigningPerms] = useState<AdminGroup | undefined>()

  const { data, isPending } = useAdminGroupList()
  const groups = data?.results ?? []

  function handleEdit(g: AdminGroup) {
    setEditing(g)
    setFormOpen(true)
  }

  function handleDelete(g: AdminGroup) {
    setDeleting(g)
  }

  function handleAssignPermissions(g: AdminGroup) {
    setAssigningPerms(g)
  }

  function handleFormSuccess() {
    setFormOpen(false)
    setEditing(undefined)
  }

  function handleNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  if (user && !user.is_superuser) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos / Roles</h1>
          <p className="text-muted-foreground">Gestiona los grupos y sus permisos</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo grupo
        </Button>
      </div>

      <GroupTable
        groups={groups}
        isLoading={isPending}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignPermissions={handleAssignPermissions}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditing(undefined)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          </DialogHeader>
          <GroupForm
            group={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditing(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {deleting && (
        <DeleteGroupDialog
          group={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}

      {assigningPerms && (
        <AssignPermissionsDialog
          group={assigningPerms}
          open={!!assigningPerms}
          onOpenChange={(open) => {
            if (!open) setAssigningPerms(undefined)
          }}
        />
      )}
    </div>
  )
}
