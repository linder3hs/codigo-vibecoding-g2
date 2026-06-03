import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import type { AdminUserCreate, AdminUserParams } from "@/types/admin"

export function useAdminUserList(params?: AdminUserParams) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminApi.users.list(params),
    staleTime: 30_000,
  })
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: ["admin-users", id],
    queryFn: () => adminApi.users.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUserCreate) => adminApi.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUserCreate> }) =>
      adminApi.users.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-users", id] })
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.users.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })
}

export function useAssignUserGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, groupIds }: { userId: number; groupIds: number[] }) =>
      adminApi.users.assignGroups(userId, groupIds),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-users", userId] })
    },
  })
}
