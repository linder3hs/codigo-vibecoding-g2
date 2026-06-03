import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import type { AdminGroupCreate, PermissionParams } from "@/types/admin"

export function useAdminGroupList() {
  return useQuery({
    queryKey: ["admin-groups"],
    queryFn: () => adminApi.groups.list(),
    staleTime: 60_000,
  })
}

export function useCreateAdminGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminGroupCreate) => adminApi.groups.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
    },
  })
}

export function useUpdateAdminGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminGroupCreate }) =>
      adminApi.groups.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
    },
  })
}

export function useDeleteAdminGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.groups.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
    },
  })
}

export function useAssignGroupPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, permissionIds }: { groupId: number; permissionIds: number[] }) =>
      adminApi.groups.assignPermissions(groupId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] })
    },
  })
}

export function usePermissionList(params?: PermissionParams) {
  return useQuery({
    queryKey: ["admin-permissions", params],
    queryFn: () => adminApi.permissions.list(params),
    staleTime: 10 * 60_000,
  })
}
