import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi, type MeUpdatePayload } from "@/lib/api/auth"
import { isAuthenticated } from "@/lib/auth"

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MeUpdatePayload) => authApi.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  })
}
