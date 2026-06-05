import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateCustomer,
  useCustomer,
  useCustomerList,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/lib/hooks/use-customers"
import type { Customer } from "@/types/customer"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockCustomer: Customer = {
  id: 7,
  name: "Test Corp",
  customer_type: "INDIVIDUAL",
  tax_id: null,
  email: "test@example.com",
  phone: "600 000 000",
  address: "Av. Siempre Viva 123",
  city: "Medellín",
  country: "Colombia",
  is_active: true,
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
}

const mockPaginated: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
}

// ─── wrapper helpers ───────────────────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ─── useCustomerList ───────────────────────────────────────────────────────────

describe("useCustomerList", () => {
  it("empieza en isPending y carga datos de la API", async () => {
    server.use(
      http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCustomerList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Test Corp")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en la queryKey", async () => {
    server.use(
      http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { search: "test", customer_type: "INDIVIDUAL" as const }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useCustomerList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cachedKeys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(cachedKeys).toContainEqual(["customers", params])
  })

  it("sin params usa queryKey ['customers', undefined]", async () => {
    server.use(
      http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCustomerList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["customers", undefined])
  })
})

// ─── useCustomer ───────────────────────────────────────────────────────────────

describe("useCustomer", () => {
  it("hace fetch del customer por id", async () => {
    server.use(
      http.get(`${BASE}/customers/7/`, () => HttpResponse.json(mockCustomer)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCustomer(7), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(7)
    expect(result.current.data?.name).toBe("Test Corp")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useCustomer(0), {
      wrapper: makeWrapper(qc),
    })

    // enabled: !!id → false cuando id=0
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateCustomer ────────────────────────────────────────────────────────

describe("useCreateCustomer", () => {
  it("invalida queryKey ['customers'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/customers/`, async () =>
        HttpResponse.json(mockCustomer, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "New Corp",
      customer_type: "COMPANY",
      email: "new@corp.com",
      phone: "600 000 001",
      address: "Calle 1",
      city: "Cali",
      country: "Colombia",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
  })
})

// ─── useUpdateCustomer ────────────────────────────────────────────────────────

describe("useUpdateCustomer", () => {
  it("invalida la lista y el detalle al completar con éxito", async () => {
    const updated = { ...mockCustomer, name: "Updated Name" }

    server.use(
      http.patch(`${BASE}/customers/7/`, async () =>
        HttpResponse.json(updated),
      ),
    )

    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 7, data: { name: "Updated Name" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // invalida lista general
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
    // invalida detalle específico
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers", 7] }),
    )
  })

  it("retorna el customer actualizado", async () => {
    const updated = { ...mockCustomer, city: "Cartagena" }

    server.use(
      http.patch(`${BASE}/customers/7/`, async () =>
        HttpResponse.json(updated),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 7, data: { city: "Cartagena" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.city).toBe("Cartagena")
  })
})

// ─── useDeleteCustomer ────────────────────────────────────────────────────────

describe("useDeleteCustomer", () => {
  it("invalida queryKey ['customers'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/customers/7/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(7)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
  })
})
