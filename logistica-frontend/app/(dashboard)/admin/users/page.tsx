"use client"

import { useState, useEffect } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAdminUserList } from "@/lib/hooks/use-admin-users"
import { useAuthStore } from "@/lib/store/auth"
import type { AdminUser, AdminUserParams } from "@/types/admin"
import { UserTable } from "@/components/modules/admin/UserTable"
import { UserForm } from "@/components/modules/admin/UserForm"
import { DeleteUserDialog } from "@/components/modules/admin/DeleteUserDialog"
import { AssignGroupsDialog } from "@/components/modules/admin/AssignGroupsDialog"

export default function AdminUsersPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user !== null && !user.is_superuser) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const [params, setParams] = useState<AdminUserParams>({ page: 1 })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | undefined>()
  const [deleting, setDeleting] = useState<AdminUser | undefined>()
  const [assigningGroups, setAssigningGroups] = useState<AdminUser | undefined>()

  useEffect(() => {
    setParams((prev) => ({ ...prev, page: pagination.pageIndex + 1 }))
  }, [pagination.pageIndex])

  const { data, isPending } = useAdminUserList(params)

  function handleEdit(u: AdminUser) {
    setEditing(u)
    setFormOpen(true)
  }

  function handleDelete(u: AdminUser) {
    setDeleting(u)
  }

  function handleAssignGroups(u: AdminUser) {
    setAssigningGroups(u)
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
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <UserTable
        data={data}
        isLoading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignGroups={handleAssignGroups}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditing(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {deleting && (
        <DeleteUserDialog
          user={deleting}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(undefined)
          }}
        />
      )}

      {assigningGroups && (
        <AssignGroupsDialog
          user={assigningGroups}
          open={!!assigningGroups}
          onOpenChange={(open) => {
            if (!open) setAssigningGroups(undefined)
          }}
        />
      )}
    </div>
  )
}
