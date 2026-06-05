import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateTransport,
  useDeleteTransport,
  useTransport,
  useTransportList,
  useUpdateTransport,
} from "@/lib/hooks/use-transport"
import type { Transport } from "@/types/transport"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockTransport: Transport = {
  id: 2,
  plate_number: "ABC-123",
  transport_type: "TRUCK",
  brand: "Ford",
  model: "Transit",
  year: 2022,
  capacity_kg: "1500.00",
  capacity_m3: "12.50",
  is_available: true,
  created_at: "2026-01-15T08:00:00Z",
  updated_at: "2026-01-15T08:00:00Z",
}

const mockPaginated: PaginatedResponse<Transport> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTransport],
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useTransportList ─────────────────────────────────────────────────────────

describe("useTransportList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/transport/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useTransportList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].plate_number).toBe("ABC-123")
    expect(result.current.data?.results[0].transport_type).toBe("TRUCK")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/transport/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { transport_type: "VAN" as const, is_available: true }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useTransportList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["transport", params])
  })

  it("sin params usa queryKey ['transport', undefined]", async () => {
    server.use(
      http.get(`${BASE}/transport/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useTransportList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["transport", undefined])
  })
})

// ─── useTransport ─────────────────────────────────────────────────────────────

describe("useTransport", () => {
  it("hace fetch del transporte por id", async () => {
    server.use(
      http.get(`${BASE}/transport/2/`, () => HttpResponse.json(mockTransport)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useTransport(2), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(2)
    expect(result.current.data?.brand).toBe("Ford")
    expect(result.current.data?.capacity_kg).toBe("1500.00")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useTransport(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateTransport ───────────────────────────────────────────────────────

describe("useCreateTransport", () => {
  it("invalida queryKey ['transport'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/transport/`, async () =>
        HttpResponse.json(mockTransport, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateTransport(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      plate_number: "ABC-123",
      transport_type: "TRUCK",
      brand: "Ford",
      model: "Transit",
      year: 2022,
      capacity_kg: 1500,
      capacity_m3: 12.5,
      is_available: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] }),
    )
  })

  it("retorna el transporte creado", async () => {
    server.use(
      http.post(`${BASE}/transport/`, async () =>
        HttpResponse.json(mockTransport, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateTransport(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      plate_number: "ABC-123",
      transport_type: "TRUCK",
      brand: "Ford",
      model: "Transit",
      year: 2022,
      capacity_kg: 1500,
      capacity_m3: 12.5,
      is_available: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(2)
    expect(result.current.data?.plate_number).toBe("ABC-123")
  })
})

// ─── useUpdateTransport ───────────────────────────────────────────────────────

describe("useUpdateTransport", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/transport/2/`, async () =>
        HttpResponse.json({ ...mockTransport, is_available: false }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateTransport(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 2, data: { is_available: false } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport", 2] }),
    )
  })

  it("retorna el transporte actualizado", async () => {
    const updated = { ...mockTransport, brand: "Mercedes" }

    server.use(
      http.patch(`${BASE}/transport/2/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateTransport(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 2, data: { brand: "Mercedes" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.brand).toBe("Mercedes")
  })
})

// ─── useDeleteTransport ───────────────────────────────────────────────────────

describe("useDeleteTransport", () => {
  it("invalida queryKey ['transport'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/transport/2/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteTransport(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(2)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] }),
    )
  })
})
