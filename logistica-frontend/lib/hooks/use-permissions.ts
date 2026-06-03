import { useMemo } from "react"
import { useMe } from "./use-me"
import { useAuthStore } from "@/lib/store/auth"

export interface PermissionHelpers {
  can: (codename: string) => boolean
  canView: (model: string) => boolean
  canAdd: (model: string) => boolean
  canChange: (model: string) => boolean
  canDelete: (model: string) => boolean
  isSuperAdmin: boolean
  isLoading: boolean
}

export function usePermissions(): PermissionHelpers {
  const { user } = useAuthStore()
  const { data: me, isPending } = useMe()

  const isSuperAdmin = user?.is_superuser ?? false

  const permSet = useMemo(() => {
    if (isSuperAdmin) return null
    const set = new Set<string>()
    me?.groups?.forEach((g) => g.permissions.forEach((p) => set.add(p.codename)))
    return set
  }, [me, isSuperAdmin])

  const can = (codename: string) => isSuperAdmin || (permSet?.has(codename) ?? false)
  const canView = (model: string) => can(`view_${model}`)
  const canAdd = (model: string) => can(`add_${model}`)
  const canChange = (model: string) => can(`change_${model}`)
  const canDelete = (model: string) => can(`delete_${model}`)

  return { can, canView, canAdd, canChange, canDelete, isSuperAdmin, isLoading: isPending }
}
