import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { warehouseApi } from "@/lib/api/warehouses"
import type { Warehouse, WarehouseCreate } from "@/types/warehouse"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("warehouseApi.list", () => {
  it("hace GET /warehouses/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/warehouses/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await warehouseApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].name).toBe("CEDI Bogotá")
    expect(data.results[0].capacity_m3).toBe("5000.00")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await warehouseApi.list({ search: "bogota", page: 2 })

    expect(qs!.get("search")).toBe("bogota")
    expect(qs!.get("page")).toBe("2")
  })

  it("pasa filtros de capacidad (gte/lte)", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await warehouseApi.list({ capacity_m3_gte: 1000, capacity_m3_lte: 9000 })

    expect(qs!.get("capacity_m3_gte")).toBe("1000")
    expect(qs!.get("capacity_m3_lte")).toBe("9000")
  })

  it("pasa city y country como filtros", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await warehouseApi.list({ city: "Bogotá", country: "Colombia" })

    expect(qs!.get("city")).toBe("Bogotá")
    expect(qs!.get("country")).toBe("Colombia")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/warehouses/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await warehouseApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("warehouseApi.get", () => {
  it("hace GET /warehouses/:id/ y retorna Warehouse", async () => {
    server.use(
      http.get(`${BASE}/warehouses/3/`, () => HttpResponse.json(mockWarehouse)),
    )

    const data = await warehouseApi.get(3)
    expect(data.id).toBe(3)
    expect(data.name).toBe("CEDI Bogotá")
    expect(data.capacity_m3).toBe("5000.00")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/warehouses/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(warehouseApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("warehouseApi.create", () => {
  it("hace POST /warehouses/ y retorna Warehouse creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockWarehouse, { status: 201 })
      }),
    )

    const payload: WarehouseCreate = {
      name: "CEDI Bogotá",
      address: "Zona Franca, Bodega 5",
      city: "Bogotá",
      country: "Colombia",
      capacity_m3: 5000,
      latitude: 4.711,
      longitude: -74.0721,
    }

    const data = await warehouseApi.create(payload)
    expect(data.id).toBe(3)
    expect(capturedBody).toMatchObject({ name: "CEDI Bogotá", capacity_m3: 5000 })
  })

  it("crea warehouse sin lat/long (campos opcionales)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/warehouses/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockWarehouse, latitude: null, longitude: null }, { status: 201 })
      }),
    )

    await warehouseApi.create({
      name: "Deposito Sur",
      address: "Carrera 1",
      city: "Cali",
      country: "Colombia",
      capacity_m3: 2000,
    })

    expect(capturedBody).toMatchObject({ name: "Deposito Sur" })
    expect((capturedBody as Record<string, unknown>).latitude).toBeUndefined()
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/warehouses/`, () =>
        HttpResponse.json(
          { capacity_m3: ["Asegúrese de que este valor sea mayor o igual a 0."] },
          { status: 400 },
        ),
      ),
    )

    await expect(
      warehouseApi.create({
        name: "X",
        address: "X",
        city: "X",
        country: "X",
        capacity_m3: -1,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("warehouseApi.update", () => {
  it("hace PATCH /warehouses/:id/ y retorna Warehouse actualizado", async () => {
    const updated = { ...mockWarehouse, name: "CEDI Bogotá Norte", capacity_m3: "8000.00" }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/warehouses/3/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await warehouseApi.update(3, { name: "CEDI Bogotá Norte", capacity_m3: 8000 })
    expect(data.name).toBe("CEDI Bogotá Norte")
    expect(capturedBody).toMatchObject({ name: "CEDI Bogotá Norte", capacity_m3: 8000 })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("warehouseApi.remove", () => {
  it("hace DELETE /warehouses/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/warehouses/3/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(warehouseApi.remove(3)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/warehouses/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(warehouseApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
