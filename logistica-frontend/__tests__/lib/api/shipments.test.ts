import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { shipmentsApi } from "@/lib/api/shipments"
import type { Shipment, ShipmentCreate, ShipmentItem, ShipmentItemCreate } from "@/types/shipment"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("shipmentsApi.list", () => {
  it("hace GET /shipments/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/shipments/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await shipmentsApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].tracking_number).toBe("TRK-20260001")
    expect(data.results[0].status).toBe("PENDING")
  })

  it("pasa status como filtro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/shipments/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await shipmentsApi.list({ status: "IN_TRANSIT" })
    expect(qs!.get("status")).toBe("IN_TRANSIT")
  })

  it("pasa customer, driver y origin_warehouse como filtros numéricos", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/shipments/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await shipmentsApi.list({ customer: 5, driver: 2, origin_warehouse: 3 })
    expect(qs!.get("customer")).toBe("5")
    expect(qs!.get("driver")).toBe("2")
    expect(qs!.get("origin_warehouse")).toBe("3")
  })

  it("pasa destination_city, search y ordering", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/shipments/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await shipmentsApi.list({
      destination_city: "Medellín",
      search: "TRK",
      ordering: "-created_at",
    })

    expect(qs!.get("destination_city")).toBe("Medellín")
    expect(qs!.get("search")).toBe("TRK")
    expect(qs!.get("ordering")).toBe("-created_at")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/shipments/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await shipmentsApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("shipmentsApi.get", () => {
  it("hace GET /shipments/:id/ y retorna Shipment", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/`, () => HttpResponse.json(mockShipment)),
    )

    const data = await shipmentsApi.get(1)
    expect(data.id).toBe(1)
    expect(data.tracking_number).toBe("TRK-20260001")
    expect(data.calculated_cost).toBe("50000.00")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/shipments/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(shipmentsApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("shipmentsApi.create", () => {
  it("hace POST /shipments/ con payload y retorna Shipment creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockShipment, { status: 201 })
      }),
    )

    const payload: ShipmentCreate = {
      customer: 5,
      origin_warehouse: 3,
      destination_address: "Calle 10 # 20-30",
      destination_city: "Medellín",
      destination_country: "Colombia",
      status: "PENDING",
    }

    const data = await shipmentsApi.create(payload)
    expect(data.tracking_number).toBe("TRK-20260001")
    expect(capturedBody).toMatchObject({
      customer: 5,
      origin_warehouse: 3,
      status: "PENDING",
    })
  })

  it("crea envío con driver, transport, route opcionales como null", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockShipment, { status: 201 })
      }),
    )

    await shipmentsApi.create({
      customer: 5,
      origin_warehouse: 3,
      destination_address: "Av. 68",
      destination_city: "Bogotá",
      destination_country: "Colombia",
      status: "CONFIRMED",
      driver: null,
      transport: null,
      route: null,
    })

    expect((capturedBody as Record<string, unknown>).driver).toBeNull()
    expect((capturedBody as Record<string, unknown>).transport).toBeNull()
    expect((capturedBody as Record<string, unknown>).route).toBeNull()
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/shipments/`, () =>
        HttpResponse.json({ customer: ["Cliente inválido."] }, { status: 400 }),
      ),
    )

    await expect(
      shipmentsApi.create({
        customer: 999,
        origin_warehouse: 1,
        destination_address: "x",
        destination_city: "x",
        destination_country: "x",
        status: "PENDING",
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("shipmentsApi.update", () => {
  it("hace PATCH /shipments/:id/ y retorna Shipment actualizado", async () => {
    const updated = { ...mockShipment, status: "IN_TRANSIT" as const }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/shipments/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await shipmentsApi.update(1, { status: "IN_TRANSIT" })
    expect(data.status).toBe("IN_TRANSIT")
    expect(capturedBody).toMatchObject({ status: "IN_TRANSIT" })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("shipmentsApi.remove", () => {
  it("hace DELETE /shipments/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/shipments/1/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(shipmentsApi.remove(1)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })
})

// ─── listItems ────────────────────────────────────────────────────────────────

describe("shipmentsApi.listItems", () => {
  it("hace GET /shipments/:id/items/ y retorna array de ShipmentItem", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/items/`, () => HttpResponse.json([mockItem])),
    )

    const data = await shipmentsApi.listItems(1)
    expect(data).toHaveLength(1)
    expect(data[0].product_name).toBe("Laptop Pro")
    expect(data[0].quantity).toBe(2)
  })

  it("retorna array vacío cuando no hay ítems", async () => {
    server.use(
      http.get(`${BASE}/shipments/1/items/`, () => HttpResponse.json([])),
    )

    const data = await shipmentsApi.listItems(1)
    expect(data).toHaveLength(0)
  })
})

// ─── createItem ───────────────────────────────────────────────────────────────

describe("shipmentsApi.createItem", () => {
  it("hace POST /shipments/:id/items/ con payload y retorna ShipmentItem", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/shipments/1/items/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockItem, { status: 201 })
      }),
    )

    const payload: ShipmentItemCreate = {
      product: 7,
      quantity: 2,
      unit_price_at_time: "25000.00",
    }

    const data = await shipmentsApi.createItem(1, payload)
    expect(data.id).toBe(10)
    expect(data.subtotal).toBe("50000.00")
    expect(capturedBody).toMatchObject({
      product: 7,
      quantity: 2,
      unit_price_at_time: "25000.00",
    })
  })
})

// ─── deleteItem ───────────────────────────────────────────────────────────────

describe("shipmentsApi.deleteItem", () => {
  it("hace DELETE /shipments/:id/items/:itemId/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/shipments/1/items/10/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(shipmentsApi.deleteItem(1, 10)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })
})
