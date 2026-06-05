import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSupplier,
  useSupplierList,
  useUpdateSupplier,
} from "@/lib/hooks/use-suppliers"
import type { Supplier } from "@/types/supplier"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockSupplier: Supplier = {
  id: 5,
  name: "Distribuidora Norte",
  contact_name: "Juan Pérez",
  email: "juan@norte.com",
  phone: "+57 300 1111111",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
  tax_id: "800111222-3",
  is_active: true,
  created_at: "2026-02-01T09:00:00Z",
  updated_at: "2026-02-01T09:00:00Z",
}

const mockPaginated: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSupplier],
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useSupplierList ──────────────────────────────────────────────────────────

describe("useSupplierList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useSupplierList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Distribuidora Norte")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { city: "Bogotá", search: "norte" }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useSupplierList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["suppliers", params])
  })

  it("sin params usa queryKey ['suppliers', undefined]", async () => {
    server.use(
      http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useSupplierList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["suppliers", undefined])
  })
})

// ─── useSupplier ──────────────────────────────────────────────────────────────

describe("useSupplier", () => {
  it("hace fetch del supplier por id", async () => {
    server.use(
      http.get(`${BASE}/suppliers/5/`, () => HttpResponse.json(mockSupplier)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useSupplier(5), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(5)
    expect(result.current.data?.contact_name).toBe("Juan Pérez")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useSupplier(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateSupplier ────────────────────────────────────────────────────────

describe("useCreateSupplier", () => {
  it("invalida queryKey ['suppliers'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/suppliers/`, async () =>
        HttpResponse.json(mockSupplier, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateSupplier(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Distribuidora Norte",
      contact_name: "Juan Pérez",
      email: "juan@norte.com",
      phone: "+57 300 1111111",
      address: "Calle 100 #10-20",
      city: "Bogotá",
      country: "Colombia",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] }),
    )
  })

  it("retorna el supplier creado", async () => {
    server.use(
      http.post(`${BASE}/suppliers/`, async () =>
        HttpResponse.json(mockSupplier, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateSupplier(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Distribuidora Norte",
      contact_name: "Juan Pérez",
      email: "juan@norte.com",
      phone: "+57 300 1111111",
      address: "Calle 100 #10-20",
      city: "Bogotá",
      country: "Colombia",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(5)
    expect(result.current.data?.name).toBe("Distribuidora Norte")
  })
})

// ─── useUpdateSupplier ────────────────────────────────────────────────────────

describe("useUpdateSupplier", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/suppliers/5/`, async () =>
        HttpResponse.json({ ...mockSupplier, contact_name: "Pedro Gómez" }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateSupplier(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 5, data: { contact_name: "Pedro Gómez" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers", 5] }),
    )
  })

  it("retorna el supplier actualizado", async () => {
    const updated = { ...mockSupplier, contact_name: "Pedro Gómez" }

    server.use(
      http.patch(`${BASE}/suppliers/5/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateSupplier(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 5, data: { contact_name: "Pedro Gómez" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.contact_name).toBe("Pedro Gómez")
  })
})

// ─── useDeleteSupplier ────────────────────────────────────────────────────────

describe("useDeleteSupplier", () => {
  it("invalida queryKey ['suppliers'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/suppliers/5/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteSupplier(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(5)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] }),
    )
  })
})
