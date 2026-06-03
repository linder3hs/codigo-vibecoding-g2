import axiosInstance from "@/lib/axios"
import type { PaginatedResponse } from "@/types/common"
import type { Route, RouteCreate, RouteParams, RouteStop, RouteStopCreate } from "@/types/route"

export const routesApi = {
  list: (params?: RouteParams) =>
    axiosInstance.get<PaginatedResponse<Route>>("routes/", { params }).then((r) => r.data),

  get: (id: number) =>
    axiosInstance.get<Route>(`routes/${id}/`).then((r) => r.data),

  create: (data: RouteCreate) =>
    axiosInstance.post<Route>("routes/", data).then((r) => r.data),

  update: (id: number, data: Partial<RouteCreate>) =>
    axiosInstance.patch<Route>(`routes/${id}/`, data).then((r) => r.data),

  remove: (id: number) =>
    axiosInstance.delete(`routes/${id}/`).then(() => undefined as void),

  listStops: (routeId: number) =>
    axiosInstance.get<RouteStop[]>(`routes/${routeId}/stops/`).then((r) => r.data),

  createStop: (routeId: number, data: RouteStopCreate) =>
    axiosInstance.post<RouteStop>(`routes/${routeId}/stops/`, data).then((r) => r.data),

  updateStop: (routeId: number, stopId: number, data: Partial<RouteStopCreate>) =>
    axiosInstance.patch<RouteStop>(`routes/${routeId}/stops/${stopId}/`, data).then((r) => r.data),

  deleteStop: (routeId: number, stopId: number) =>
    axiosInstance.delete(`routes/${routeId}/stops/${stopId}/`).then(() => undefined as void),
}
