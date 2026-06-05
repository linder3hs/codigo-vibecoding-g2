import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateRoute,
  useDeleteRoute,
  useRoute,
  useRouteList,
  useUpdateRoute,
  useRouteStops,
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
} from "@/lib/hooks/use-routes"
import type { Route, RouteStop } from "@/types/route"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixtures ──────────────────────────────────────────────────────────────────

const mockRoute: Route = {
  id: 1,
  name: "Ruta Bogotá - Medellín",
  origin_warehouse: 3,
  estimated_duration_hours: "8.50",
  estimated_distance_km: "450.00",
  is_active: true,
  created_at: "2026-03-01T08:00:00Z",
  updated_at: "2026-03-01T08:00:00Z",
}

const mockPaginated: PaginatedResponse<Route> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockRoute],
}

const mockStop: RouteStop = {
  id: 10,
  route: 1,
  stop_order: 1,
  address: "Calle 10 # 20-30",
  city: "Manizales",
  estimated_offset_hours: "2.50",
  latitude: "5.0703",
  longitude: "-75.5138",
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useRouteList ─────────────────────────────────────────────────────────────

describe("useRouteList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useRouteList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Ruta Bogotá - Medellín")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { origin_warehouse: 3, page: 1 }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useRouteList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["routes", params])
  })

  it("sin params usa queryKey ['routes', undefined]", async () => {
    server.use(
      http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useRouteList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["routes", undefined])
  })
})

// ─── useRoute ─────────────────────────────────────────────────────────────────

describe("useRoute", () => {
  it("hace fetch de la ruta por id", async () => {
    server.use(
      http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useRoute(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.name).toBe("Ruta Bogotá - Medellín")
    expect(result.current.data?.estimated_distance_km).toBe("450.00")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useRoute(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateRoute ───────────────────────────────────────────────────────────

describe("useCreateRoute", () => {
  it("invalida queryKey ['routes'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/routes/`, async () =>
        HttpResponse.json(mockRoute, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateRoute(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Ruta Bogotá - Medellín",
      origin_warehouse: 3,
      estimated_duration_hours: 8.5,
      estimated_distance_km: 450,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] }),
    )
  })

  it("retorna la ruta creada", async () => {
    server.use(
      http.post(`${BASE}/routes/`, async () =>
        HttpResponse.json(mockRoute, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateRoute(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Ruta Bogotá - Medellín",
      origin_warehouse: 3,
      estimated_duration_hours: 8.5,
      estimated_distance_km: 450,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe("Ruta Bogotá - Medellín")
  })
})

// ─── useUpdateRoute ───────────────────────────────────────────────────────────

describe("useUpdateRoute", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/routes/1/`, async () =>
        HttpResponse.json({ ...mockRoute, name: "Ruta actualizada" }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateRoute(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Ruta actualizada" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes", 1] }),
    )
  })

  it("retorna la ruta actualizada", async () => {
    const updated = { ...mockRoute, estimated_distance_km: "500.00" }

    server.use(
      http.patch(`${BASE}/routes/1/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateRoute(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 1, data: { estimated_distance_km: 500 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.estimated_distance_km).toBe("500.00")
  })
})

// ─── useDeleteRoute ───────────────────────────────────────────────────────────

describe("useDeleteRoute", () => {
  it("invalida queryKey ['routes'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/routes/1/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteRoute(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] }),
    )
  })
})

// ─── useRouteStops ────────────────────────────────────────────────────────────

describe("useRouteStops", () => {
  it("usa queryKey ['routes', routeId, 'stops']", async () => {
    server.use(
      http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop])),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useRouteStops(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["routes", 1, "stops"])
  })

  it("retorna array de paradas", async () => {
    server.use(
      http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop])),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useRouteStops(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].city).toBe("Manizales")
  })

  it("no hace fetch cuando routeId es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useRouteStops(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateRouteStop ───────────────────────────────────────────────────────

describe("useCreateRouteStop", () => {
  it("invalida queryKey ['routes', routeId, 'stops'] al completar", async () => {
    server.use(
      http.post(`${BASE}/routes/1/stops/`, async () =>
        HttpResponse.json(mockStop, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateRouteStop(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      stop_order: 1,
      address: "Calle 10 # 20-30",
      city: "Manizales",
      estimated_offset_hours: 2.5,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes", 1, "stops"] }),
    )
  })

  it("retorna la parada creada", async () => {
    server.use(
      http.post(`${BASE}/routes/1/stops/`, async () =>
        HttpResponse.json(mockStop, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateRouteStop(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      stop_order: 1,
      address: "Calle 10 # 20-30",
      city: "Manizales",
      estimated_offset_hours: 2.5,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.city).toBe("Manizales")
    expect(result.current.data?.stop_order).toBe(1)
  })
})

// ─── useUpdateRouteStop ───────────────────────────────────────────────────────

describe("useUpdateRouteStop", () => {
  it("invalida queryKey ['routes', routeId, 'stops'] al completar", async () => {
    server.use(
      http.patch(`${BASE}/routes/1/stops/10/`, async () =>
        HttpResponse.json({ ...mockStop, city: "Pereira" }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateRouteStop(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ stopId: 10, data: { city: "Pereira" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes", 1, "stops"] }),
    )
  })

  it("retorna la parada actualizada", async () => {
    const updated = { ...mockStop, city: "Pereira" }

    server.use(
      http.patch(`${BASE}/routes/1/stops/10/`, async () =>
        HttpResponse.json(updated),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateRouteStop(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ stopId: 10, data: { city: "Pereira" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.city).toBe("Pereira")
  })
})

// ─── useDeleteRouteStop ───────────────────────────────────────────────────────

describe("useDeleteRouteStop", () => {
  it("invalida queryKey ['routes', routeId, 'stops'] al eliminar parada", async () => {
    server.use(
      http.delete(`${BASE}/routes/1/stops/10/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteRouteStop(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(10)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes", 1, "stops"] }),
    )
  })
})
