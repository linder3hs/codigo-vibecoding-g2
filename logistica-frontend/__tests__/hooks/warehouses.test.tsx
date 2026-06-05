import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouse,
  useWarehouseList,
} from "@/lib/hooks/use-warehouses"
import type { Warehouse } from "@/types/warehouse"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockWarehouse: Warehouse = {
  id: 3,
  name: "CEDI Bogotá",
  address: "Zona Franca, Bodega 5",
  city: "Bogotá",
  country: "Colombia",
  latitude: 4.711,
  longitude: -74.0721,
  capacity_m3: "5000.00",
  is_active: true,
  created_at: "2026-01-10T08:00:00Z",
  updated_at: "2026-01-10T08:00:00Z",
}

const mockPaginated: PaginatedResponse<Warehouse> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockWarehouse],
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useWarehouseList ─────────────────────────────────────────────────────────

describe("useWarehouseList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useWarehouseList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("CEDI Bogotá")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { city: "Bogotá", capacity_m3_gte: 1000 }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useWarehouseList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["warehouses", params])
  })

  it("sin params usa queryKey ['warehouses', undefined]", async () => {
    server.use(
      http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useWarehouseList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["warehouses", undefined])
  })
})

// ─── useWarehouse ─────────────────────────────────────────────────────────────

describe("useWarehouse", () => {
  it("hace fetch del warehouse por id", async () => {
    server.use(
      http.get(`${BASE}/warehouses/3/`, () => HttpResponse.json(mockWarehouse)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useWarehouse(3), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(3)
    expect(result.current.data?.capacity_m3).toBe("5000.00")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useWarehouse(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateWarehouse ───────────────────────────────────────────────────────

describe("useCreateWarehouse", () => {
  it("invalida queryKey ['warehouses'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/warehouses/`, async () =>
        HttpResponse.json(mockWarehouse, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateWarehouse(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Nuevo CEDI",
      address: "Calle 1",
      city: "Medellín",
      country: "Colombia",
      capacity_m3: 3000,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] }),
    )
  })
})

// ─── useUpdateWarehouse ───────────────────────────────────────────────────────

describe("useUpdateWarehouse", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/warehouses/3/`, async () =>
        HttpResponse.json({ ...mockWarehouse, name: "CEDI Bogotá Sur" }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateWarehouse(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 3, data: { name: "CEDI Bogotá Sur" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses", 3] }),
    )
  })

  it("retorna el warehouse actualizado", async () => {
    const updated = { ...mockWarehouse, capacity_m3: "9000.00" }

    server.use(
      http.patch(`${BASE}/warehouses/3/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateWarehouse(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 3, data: { capacity_m3: 9000 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.capacity_m3).toBe("9000.00")
  })
})

// ─── useDeleteWarehouse ───────────────────────────────────────────────────────

describe("useDeleteWarehouse", () => {
  it("invalida queryKey ['warehouses'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/warehouses/3/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteWarehouse(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] }),
    )
  })
})
