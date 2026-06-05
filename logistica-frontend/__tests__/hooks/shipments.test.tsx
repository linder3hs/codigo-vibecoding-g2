import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateShipment,
  useDeleteShipment,
  useShipment,
  useShipmentItems,
  useShipmentList,
  useUpdateShipment,
  useCreateShipmentItem,
  useDeleteShipmentItem,
} from "@/lib/hooks/use-shipments"
import type { Shipment, ShipmentItem } from "@/types/shipment"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixtures ──────────────────────────────────────────────────────────────────

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-20260001",
  customer: 5,
  customer_name: "Empresa ABC",
  origin_warehouse: 3,
  destination_address: "Calle 10 # 20-30",
  destination_city: "Medellín",
  destination_country: "Colombia",
  status: "PENDING",
  estimated_delivery_date: "2026-05-15",
  driver: null,
  transport: null,
  route: null,
  notes: "",
  weight_total_kg: "5.00",
  base_cost: "0.00",
  calculated_cost: "50000.00",
  created_at: "2026-04-01T08:00:00Z",
  updated_at: "2026-04-01T08:00:00Z",
}

const mockPaginated: PaginatedResponse<Shipment> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockShipment],
}

const mockItem: ShipmentItem = {
  id: 10,
  shipment: 1,
  product: 7,
  product_name: "Laptop Pro",
  product_sku: "SKU-001",
  quantity: 2,
  unit_price_at_time: "25000.00",
  subtotal: "50000.00",
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-04-01T09:00:00Z",
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useShipmentList ──────────────────────────────────────────────────────────

describe("useShipmentList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipmentList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].tracking_number).toBe("TRK-20260001")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { status: "PENDING" as const, customer: 5 }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useShipmentList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["shipments", params])
  })

  it("sin params usa queryKey ['shipments', undefined]", async () => {
    server.use(
      http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipmentList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["shipments", undefined])
  })
})

// ─── useShipment ──────────────────────────────────────────────────────────────

describe("useShipment", () => {
  it("hace fetch del envío por id", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipment(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.status).toBe("PENDING")
    expect(result.current.data?.calculated_cost).toBe("50000.00")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipment(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateShipment ────────────────────────────────────────────────────────

describe("useCreateShipment", () => {
  it("invalida queryKey ['shipments'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/shipments/`, async () =>
        HttpResponse.json(mockShipment, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateShipment(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      customer: 5,
      origin_warehouse: 3,
      destination_address: "Calle 10 # 20-30",
      destination_city: "Medellín",
      destination_country: "Colombia",
      status: "PENDING",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] }),
    )
  })

  it("retorna el envío creado con tracking_number autogenerado", async () => {
    server.use(
      http.post(`${BASE}/shipments/`, async () =>
        HttpResponse.json(mockShipment, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateShipment(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      customer: 5,
      origin_warehouse: 3,
      destination_address: "x",
      destination_city: "x",
      destination_country: "Colombia",
      status: "PENDING",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.tracking_number).toBe("TRK-20260001")
  })
})

// ─── useUpdateShipment ────────────────────────────────────────────────────────

describe("useUpdateShipment", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/shipments/1/`, async () =>
        HttpResponse.json({ ...mockShipment, status: "IN_TRANSIT" }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateShipment(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 1, data: { status: "IN_TRANSIT" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments", 1] }),
    )
  })

  it("retorna el envío actualizado", async () => {
    const updated = { ...mockShipment, status: "DELIVERED" as const, driver: 2 }

    server.use(
      http.patch(`${BASE}/shipments/1/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateShipment(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 1, data: { status: "DELIVERED", driver: 2 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe("DELIVERED")
    expect(result.current.data?.driver).toBe(2)
  })
})

// ─── useDeleteShipment ────────────────────────────────────────────────────────

describe("useDeleteShipment", () => {
  it("invalida queryKey ['shipments'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/shipments/1/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteShipment(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] }),
    )
  })
})

// ─── useShipmentItems ─────────────────────────────────────────────────────────

describe("useShipmentItems", () => {
  it("usa queryKey ['shipments', shipmentId, 'items']", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/items/`, () => HttpResponse.json([mockItem])),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipmentItems(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["shipments", 1, "items"])
  })

  it("retorna array de ítems", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/items/`, () => HttpResponse.json([mockItem])),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipmentItems(1), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].product_name).toBe("Laptop Pro")
  })

  it("no hace fetch cuando shipmentId es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useShipmentItems(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateShipmentItem ────────────────────────────────────────────────────

describe("useCreateShipmentItem", () => {
  it("invalida ['shipments', shipmentId, 'items'] y ['shipments', shipmentId]", async () => {
    server.use(
      http.post(`${BASE}/shipments/1/items/`, async () =>
        HttpResponse.json(mockItem, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateShipmentItem(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      shipmentId: 1,
      data: { product: 7, quantity: 2, unit_price_at_time: "25000.00" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments", 1, "items"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments", 1] }),
    )
  })

  it("retorna el ítem creado", async () => {
    server.use(
      http.post(`${BASE}/shipments/1/items/`, async () =>
        HttpResponse.json(mockItem, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateShipmentItem(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      shipmentId: 1,
      data: { product: 7, quantity: 2, unit_price_at_time: "25000.00" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.subtotal).toBe("50000.00")
    expect(result.current.data?.product_name).toBe("Laptop Pro")
  })
})

// ─── useDeleteShipmentItem ────────────────────────────────────────────────────

describe("useDeleteShipmentItem", () => {
  it("invalida ['shipments', shipmentId, 'items'] y ['shipments', shipmentId]", async () => {
    server.use(
      http.delete(`${BASE}/shipments/1/items/10/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteShipmentItem(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ shipmentId: 1, itemId: 10 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments", 1, "items"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments", 1] }),
    )
  })
})
