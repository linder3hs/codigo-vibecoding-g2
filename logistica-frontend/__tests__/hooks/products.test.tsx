import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { server } from "@/test/msw/server"
import { makeQueryClient } from "@/test/utils/renderWithQuery"
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useProductList,
  useUpdateProduct,
} from "@/lib/hooks/use-products"
import type { Product } from "@/types/product"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

// ─── fixture ───────────────────────────────────────────────────────────────────

const mockProduct: Product = {
  id: 7,
  name: "Caja corrugada",
  sku: "PROD-001",
  category: "Embalaje",
  supplier: 5,
  warehouse: 3,
  weight_kg: "2.50",
  width_cm: "30.00",
  height_cm: "20.00",
  depth_cm: "15.00",
  unit_price: "9500.00",
  stock_quantity: 200,
  description: "Caja de cartón corrugado",
  image_url: null,
  is_active: true,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
}

const mockPaginated: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockProduct],
}

// ─── wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ─── useProductList ───────────────────────────────────────────────────────────

describe("useProductList", () => {
  it("empieza en isPending y carga datos", async () => {
    server.use(
      http.get(`${BASE}/products/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useProductList(), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Caja corrugada")
    expect(result.current.data?.results[0].unit_price).toBe("9500.00")
    expect(result.current.data?.count).toBe(1)
  })

  it("incluye params en queryKey", async () => {
    server.use(
      http.get(`${BASE}/products/`, () => HttpResponse.json(mockPaginated)),
    )

    const params = { category: "Embalaje", supplier: 5 }
    const qc = makeQueryClient()

    const { result } = renderHook(() => useProductList(params), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["products", params])
  })

  it("sin params usa queryKey ['products', undefined]", async () => {
    server.use(
      http.get(`${BASE}/products/`, () => HttpResponse.json(mockPaginated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useProductList(), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = qc.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["products", undefined])
  })
})

// ─── useProduct ───────────────────────────────────────────────────────────────

describe("useProduct", () => {
  it("hace fetch del producto por id", async () => {
    server.use(
      http.get(`${BASE}/products/7/`, () => HttpResponse.json(mockProduct)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useProduct(7), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(7)
    expect(result.current.data?.sku).toBe("PROD-001")
  })

  it("no hace fetch cuando id es 0 (enabled: false)", () => {
    const qc = makeQueryClient()
    const { result } = renderHook(() => useProduct(0), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── useCreateProduct ─────────────────────────────────────────────────────────

describe("useCreateProduct", () => {
  it("invalida queryKey ['products'] al completar con éxito", async () => {
    server.use(
      http.post(`${BASE}/products/`, async () =>
        HttpResponse.json(mockProduct, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Caja corrugada",
      sku: "PROD-001",
      category: "Embalaje",
      supplier: 5,
      warehouse: 3,
      weight_kg: 2.5,
      width_cm: 30,
      height_cm: 20,
      depth_cm: 15,
      unit_price: 9500,
      stock_quantity: 200,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] }),
    )
  })

  it("retorna el producto creado", async () => {
    server.use(
      http.post(`${BASE}/products/`, async () =>
        HttpResponse.json(mockProduct, { status: 201 }),
      ),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Caja corrugada",
      sku: "PROD-001",
      category: "Embalaje",
      supplier: 5,
      warehouse: 3,
      weight_kg: 2.5,
      width_cm: 30,
      height_cm: 20,
      depth_cm: 15,
      unit_price: 9500,
      stock_quantity: 200,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(7)
    expect(result.current.data?.sku).toBe("PROD-001")
  })
})

// ─── useUpdateProduct ─────────────────────────────────────────────────────────

describe("useUpdateProduct", () => {
  it("invalida lista y detalle al completar con éxito", async () => {
    server.use(
      http.patch(`${BASE}/products/7/`, async () =>
        HttpResponse.json({ ...mockProduct, stock_quantity: 300 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 7, data: { stock_quantity: 300 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] }),
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products", 7] }),
    )
  })

  it("retorna el producto actualizado", async () => {
    const updated = { ...mockProduct, unit_price: "12000.00" }

    server.use(
      http.patch(`${BASE}/products/7/`, async () => HttpResponse.json(updated)),
    )

    const qc = makeQueryClient()
    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ id: 7, data: { unit_price: 12000 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.unit_price).toBe("12000.00")
  })
})

// ─── useDeleteProduct ─────────────────────────────────────────────────────────

describe("useDeleteProduct", () => {
  it("invalida queryKey ['products'] al eliminar", async () => {
    server.use(
      http.delete(`${BASE}/products/7/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const qc = makeQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(7)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] }),
    )
  })
})
