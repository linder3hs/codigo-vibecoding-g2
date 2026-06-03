import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { routesApi } from "@/lib/api/routes"
import type { RouteCreate, RouteParams, RouteStopCreate } from "@/types/route"

export function useRouteList(params?: RouteParams) {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: () => routesApi.list(params),
    staleTime: 30_000,
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => routesApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RouteCreate) => routesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
    },
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RouteCreate> }) =>
      routesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      queryClient.invalidateQueries({ queryKey: ["routes", id] })
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => routesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
    },
  })
}

export function useRouteStops(routeId: number) {
  return useQuery({
    queryKey: ["routes", routeId, "stops"],
    queryFn: () => routesApi.listStops(routeId),
    enabled: !!routeId,
    staleTime: 30_000,
  })
}

export function useCreateRouteStop(routeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RouteStopCreate) => routesApi.createStop(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes", routeId, "stops"] })
    },
  })
}

export function useUpdateRouteStop(routeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: Partial<RouteStopCreate> }) =>
      routesApi.updateStop(routeId, stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes", routeId, "stops"] })
    },
  })
}

export function useDeleteRouteStop(routeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stopId: number) => routesApi.deleteStop(routeId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes", routeId, "stops"] })
    },
  })
}
