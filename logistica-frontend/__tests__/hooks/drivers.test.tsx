import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateDriver,
  useDeleteDriver,
  useDriver,
  useDriverList,
  useUpdateDriver,
} from "@/lib/hooks/use-drivers"
import type { Driver } from "@/types/driver"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockDriver: Driver = {
  id: 4,
  user: 8,
  user_full_name: "Carlos Ramírez",
  user_email: "carlos@empresa.com",
  user_username: "carlos.r",
  transport: 2,
  license_number: "LIC-001234",
  license_expiry: "2027-06-30",
  phone: "+57 310 000 0000",
  is_active: true,
  created_at: "2026-02-10T09:00:00Z",
  updated_at: "2026-02-10T09:00:00Z",
}

const mockPaginated: PaginatedResponse<Driver> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockDriver],
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useDriverList ────────────────────────────────────────────────────────────

describe("useDriverList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useDriverList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].user_full_name).toBe("Carlos Ramírez")
    expect(result.current.data?.results[0].license_expiry).toBe("2027-06-30")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { is_active: true, transport: 2 }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useDriverList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["drivers", params])
  })

  it("sin params usa queryKey ['drivers', undefined]", async () => {
    server.use(
      http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useDriverList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["drivers", undefined])
  })
})

// ─── useDriver ────────────────────────────────────────────────────────────────

describe("useDriver", () => {
  it("hace fetch del conductor por id", async () => {
    server.use(
      http.get(`${BASE}/drivers/4/`, () => HttpResponse.json(mockDriver)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useDriver(4), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(4)
    expect(result.current.data?.user_full_name).toBe("Carlos Ramírez")
    expect(result.current.data?.transport).toBe(2)
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useDriver(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateDriver ──────────────────────────────────────────────────────────

describe("useCreateDriver", () => {
  it("invalida queryKey ['drivers'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/drivers/`, async () =>
        HttpResponse.json(mockDriver, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateDriver(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      user: 8,
      license_number: "LIC-001234",
      license_expiry: "2027-06-30",
      phone: "+57 310 000 0000",
      transport: 2,
      is_active: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] }),
    )
  })

  it("retorna el conductor creado con datos de usuario", async () => {
    server.use(
      http.post(`${BASE}/drivers/`, async () =>
        HttpResponse.json(mockDriver, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateDriver(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      user: 8,
      license_number: "LIC-001234",
      license_expiry: "2027-06-30",
      phone: "+57 310 000 0000",
      transport: null,
      is_active: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.user_full_name).toBe("Carlos Ramírez")
    expect(result.current.data?.license_number).toBe("LIC-001234")
  })
})

// ─── useUpdateDriver ──────────────────────────────────────────────────────────

describe("useUpdateDriver", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/drivers/4/`, async () =>
        HttpResponse.json({ ...mockDriver, is_active: false }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateDriver(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 4, data: { is_active: false } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers", 4] }),
    )
  })

  it("retorna el conductor actualizado", async () => {
    const updated = { ...mockDriver, transport: null }

    server.use(
      http.patch(`${BASE}/drivers/4/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateDriver(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 4, data: { transport: null } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.transport).toBeNull()
  })
})

// ─── useDeleteDriver ──────────────────────────────────────────────────────────

describe("useDeleteDriver", () => {
  it("invalida queryKey ['drivers'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/drivers/4/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteDriver(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(4)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] }),
    )
  })
})
