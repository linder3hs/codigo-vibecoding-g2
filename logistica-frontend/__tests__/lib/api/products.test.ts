import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { productsApi } from "@/lib/api/products"
import type { Product, ProductCreate } from "@/types/product"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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
  description: "Caja de cartón corrugado para embalaje",
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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("productsApi.list", () => {
  it("hace GET /products/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/products/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await productsApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].name).toBe("Caja corrugada")
    expect(data.results[0].sku).toBe("PROD-001")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list({ search: "caja", page: 2 })

    expect(qs!.get("search")).toBe("caja")
    expect(qs!.get("page")).toBe("2")
  })

  it("pasa filtros de proveedor y almacén", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list({ supplier: 5, warehouse: 3 })

    expect(qs!.get("supplier")).toBe("5")
    expect(qs!.get("warehouse")).toBe("3")
  })

  it("pasa filtros de rango de precio", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list({ unit_price_gte: 5000, unit_price_lte: 15000 })

    expect(qs!.get("unit_price_gte")).toBe("5000")
    expect(qs!.get("unit_price_lte")).toBe("15000")
  })

  it("pasa filtros de rango de stock", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list({ stock_quantity_gte: 50, stock_quantity_lte: 500 })

    expect(qs!.get("stock_quantity_gte")).toBe("50")
    expect(qs!.get("stock_quantity_lte")).toBe("500")
  })

  it("pasa category y ordering", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list({ category: "Embalaje", ordering: "-unit_price" })

    expect(qs!.get("category")).toBe("Embalaje")
    expect(qs!.get("ordering")).toBe("-unit_price")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/products/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await productsApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("productsApi.get", () => {
  it("hace GET /products/:id/ y retorna Product", async () => {
    server.use(
      http.get(`${BASE}/products/7/`, () => HttpResponse.json(mockProduct)),
    )

    const data = await productsApi.get(7)
    expect(data.id).toBe(7)
    expect(data.sku).toBe("PROD-001")
    expect(data.unit_price).toBe("9500.00")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/products/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(productsApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("productsApi.create", () => {
  it("hace POST /products/ con payload completo y retorna Product creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockProduct, { status: 201 })
      }),
    )

    const payload: ProductCreate = {
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
      description: "Caja de cartón corrugado",
    }

    const data = await productsApi.create(payload)
    expect(data.id).toBe(7)
    expect(capturedBody).toMatchObject({
      name: "Caja corrugada",
      sku: "PROD-001",
      supplier: 5,
      warehouse: 3,
      unit_price: 9500,
    })
  })

  it("crea sin description (campo opcional)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/products/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockProduct, description: null }, { status: 201 })
      }),
    )

    await productsApi.create({
      name: "Producto sin descripción",
      sku: "PROD-002",
      category: "Otro",
      supplier: 5,
      warehouse: 3,
      weight_kg: 1,
      width_cm: 10,
      height_cm: 10,
      depth_cm: 10,
      unit_price: 1000,
      stock_quantity: 50,
    })

    expect((capturedBody as Record<string, unknown>).description).toBeUndefined()
  })

  it("propaga error 400 de validación (SKU duplicado)", async () => {
    server.use(
      http.post(`${BASE}/products/`, () =>
        HttpResponse.json(
          { sku: ["Ya existe un producto con este SKU."] },
          { status: 400 },
        ),
      ),
    )

    await expect(
      productsApi.create({
        name: "X",
        sku: "PROD-001",
        category: "X",
        supplier: 1,
        warehouse: 1,
        weight_kg: 1,
        width_cm: 1,
        height_cm: 1,
        depth_cm: 1,
        unit_price: 100,
        stock_quantity: 0,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("productsApi.update", () => {
  it("hace PATCH /products/:id/ y retorna Product actualizado", async () => {
    const updated = { ...mockProduct, stock_quantity: 300 }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/products/7/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await productsApi.update(7, { stock_quantity: 300 })
    expect(data.stock_quantity).toBe(300)
    expect(capturedBody).toMatchObject({ stock_quantity: 300 })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("productsApi.remove", () => {
  it("hace DELETE /products/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/products/7/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(productsApi.remove(7)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/products/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(productsApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
