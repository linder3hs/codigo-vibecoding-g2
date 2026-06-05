import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { transportApi } from "@/lib/api/transport"
import type { Transport, TransportCreate } from "@/types/transport"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("transportApi.list", () => {
  it("hace GET /transport/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/transport/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await transportApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].plate_number).toBe("ABC-123")
    expect(data.results[0].transport_type).toBe("TRUCK")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ search: "ford", page: 2 })

    expect(qs!.get("search")).toBe("ford")
    expect(qs!.get("page")).toBe("2")
  })

  it("pasa transport_type como filtro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ transport_type: "VAN" })
    expect(qs!.get("transport_type")).toBe("VAN")
  })

  it("pasa is_available como filtro booleano", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ is_available: true })
    expect(qs!.get("is_available")).toBe("true")
  })

  it("pasa filtros de rango de capacidad en kg", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ capacity_kg_gte: 500, capacity_kg_lte: 3000 })

    expect(qs!.get("capacity_kg_gte")).toBe("500")
    expect(qs!.get("capacity_kg_lte")).toBe("3000")
  })

  it("pasa filtros de rango de capacidad en m³", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ capacity_m3_gte: 5, capacity_m3_lte: 20 })

    expect(qs!.get("capacity_m3_gte")).toBe("5")
    expect(qs!.get("capacity_m3_lte")).toBe("20")
  })

  it("pasa ordering como parámetro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list({ ordering: "-year" })
    expect(qs!.get("ordering")).toBe("-year")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/transport/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await transportApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("transportApi.get", () => {
  it("hace GET /transport/:id/ y retorna Transport", async () => {
    server.use(
      http.get(`${BASE}/transport/2/`, () => HttpResponse.json(mockTransport)),
    )

    const data = await transportApi.get(2)
    expect(data.id).toBe(2)
    expect(data.plate_number).toBe("ABC-123")
    expect(data.capacity_kg).toBe("1500.00")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/transport/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(transportApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("transportApi.create", () => {
  it("hace POST /transport/ con payload completo y retorna Transport creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/transport/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockTransport, { status: 201 })
      }),
    )

    const payload: TransportCreate = {
      plate_number: "ABC-123",
      transport_type: "TRUCK",
      brand: "Ford",
      model: "Transit",
      year: 2022,
      capacity_kg: 1500,
      capacity_m3: 12.5,
      is_available: true,
    }

    const data = await transportApi.create(payload)
    expect(data.id).toBe(2)
    expect(capturedBody).toMatchObject({
      plate_number: "ABC-123",
      transport_type: "TRUCK",
      brand: "Ford",
      capacity_kg: 1500,
      is_available: true,
    })
  })

  it("crea con is_available=false", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/transport/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { ...mockTransport, is_available: false },
          { status: 201 },
        )
      }),
    )

    await transportApi.create({
      plate_number: "XYZ-999",
      transport_type: "MOTORCYCLE",
      brand: "Honda",
      model: "CB500",
      year: 2021,
      capacity_kg: 100,
      capacity_m3: 0.5,
      is_available: false,
    })

    expect((capturedBody as Record<string, unknown>).is_available).toBe(false)
  })

  it("propaga error 400 (placa duplicada)", async () => {
    server.use(
      http.post(`${BASE}/transport/`, () =>
        HttpResponse.json(
          { plate_number: ["Ya existe un vehículo con esta placa."] },
          { status: 400 },
        ),
      ),
    )

    await expect(
      transportApi.create({
        plate_number: "ABC-123",
        transport_type: "VAN",
        brand: "Renault",
        model: "Master",
        year: 2023,
        capacity_kg: 800,
        capacity_m3: 8,
        is_available: true,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("transportApi.update", () => {
  it("hace PATCH /transport/:id/ y retorna Transport actualizado", async () => {
    const updated = { ...mockTransport, is_available: false }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/transport/2/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await transportApi.update(2, { is_available: false })
    expect(data.is_available).toBe(false)
    expect(capturedBody).toMatchObject({ is_available: false })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("transportApi.remove", () => {
  it("hace DELETE /transport/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/transport/2/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(transportApi.remove(2)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/transport/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(transportApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
