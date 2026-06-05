import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { routesApi } from "@/lib/api/routes"
import type { Route, RouteCreate, RouteStop, RouteStopCreate } from "@/types/route"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

// ─── fixtures ──────────────────────────────────────────────────────────────────

const mockRoute: Route = {
  id: 1,
  name: "Ruta Bogotá - Medellín",
  origin_warehouse: 3,
  estimated_duration_hours: "8.50",
  estimated_distance_km: "450.00",
  is_active: true,
  created_at: "2026-03-01T08:00:00Z",
  updated_at: "2026-03-01T08:00:00Z",
}

const mockPaginated: PaginatedResponse<Route> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockRoute],
}

const mockStop: RouteStop = {
  id: 10,
  route: 1,
  stop_order: 1,
  address: "Calle 10 # 20-30",
  city: "Manizales",
  estimated_offset_hours: "2.50",
  latitude: "5.0703",
  longitude: "-75.5138",
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
}

// ─── list ──────────────────────────────────────────────────────────────────────

describe("routesApi.list", () => {
  it("hace GET /routes/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/routes/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await routesApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].name).toBe("Ruta Bogotá - Medellín")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await routesApi.list({ search: "bogotá", page: 2 })

    expect(qs!.get("search")).toBe("bogotá")
    expect(qs!.get("page")).toBe("2")
  })

  it("pasa origin_warehouse como filtro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await routesApi.list({ origin_warehouse: 3 })
    expect(qs!.get("origin_warehouse")).toBe("3")
  })

  it("pasa ordering como parámetro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await routesApi.list({ ordering: "-estimated_distance_km" })
    expect(qs!.get("ordering")).toBe("-estimated_distance_km")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/routes/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await routesApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("routesApi.get", () => {
  it("hace GET /routes/:id/ y retorna Route", async () => {
    server.use(
      http.get(`${BASE}/routes/1/`, () => HttpResponse.json(mockRoute)),
    )

    const data = await routesApi.get(1)
    expect(data.id).toBe(1)
    expect(data.estimated_distance_km).toBe("450.00")
    expect(data.estimated_duration_hours).toBe("8.50")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/routes/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(routesApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("routesApi.create", () => {
  it("hace POST /routes/ con payload y retorna Route creada", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockRoute, { status: 201 })
      }),
    )

    const payload: RouteCreate = {
      name: "Ruta Bogotá - Medellín",
      origin_warehouse: 3,
      estimated_duration_hours: 8.5,
      estimated_distance_km: 450,
    }

    const data = await routesApi.create(payload)
    expect(data.id).toBe(1)
    expect(capturedBody).toMatchObject({
      name: "Ruta Bogotá - Medellín",
      origin_warehouse: 3,
      estimated_duration_hours: 8.5,
      estimated_distance_km: 450,
    })
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/routes/`, () =>
        HttpResponse.json({ name: ["Ya existe una ruta con este nombre."] }, { status: 400 }),
      ),
    )

    await expect(
      routesApi.create({ name: "X", origin_warehouse: 1, estimated_duration_hours: 1, estimated_distance_km: 1 }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("routesApi.update", () => {
  it("hace PATCH /routes/:id/ y retorna Route actualizada", async () => {
    const updated = { ...mockRoute, estimated_distance_km: "500.00" }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/routes/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await routesApi.update(1, { estimated_distance_km: 500 })
    expect(data.estimated_distance_km).toBe("500.00")
    expect(capturedBody).toMatchObject({ estimated_distance_km: 500 })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("routesApi.remove", () => {
  it("hace DELETE /routes/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/routes/1/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(routesApi.remove(1)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })
})

// ─── listStops ────────────────────────────────────────────────────────────────

describe("routesApi.listStops", () => {
  it("hace GET /routes/:routeId/stops/ y retorna array de RouteStop", async () => {
    server.use(
      http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop])),
    )

    const data = await routesApi.listStops(1)
    expect(data).toHaveLength(1)
    expect(data[0].stop_order).toBe(1)
    expect(data[0].city).toBe("Manizales")
  })

  it("retorna array vacío cuando no hay paradas", async () => {
    server.use(
      http.get(`${BASE}/routes/1/stops/`, () => HttpResponse.json([])),
    )

    const data = await routesApi.listStops(1)
    expect(data).toHaveLength(0)
  })
})

// ─── createStop ───────────────────────────────────────────────────────────────

describe("routesApi.createStop", () => {
  it("hace POST /routes/:routeId/stops/ con payload y retorna RouteStop", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/1/stops/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockStop, { status: 201 })
      }),
    )

    const payload: RouteStopCreate = {
      stop_order: 1,
      address: "Calle 10 # 20-30",
      city: "Manizales",
      estimated_offset_hours: 2.5,
      latitude: 5.0703,
      longitude: -75.5138,
    }

    const data = await routesApi.createStop(1, payload)
    expect(data.id).toBe(10)
    expect(capturedBody).toMatchObject({
      stop_order: 1,
      city: "Manizales",
      estimated_offset_hours: 2.5,
    })
  })

  it("crea parada sin coordenadas (opcionales)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/routes/1/stops/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockStop, latitude: null, longitude: null }, { status: 201 })
      }),
    )

    await routesApi.createStop(1, {
      stop_order: 2,
      address: "Av. 68 #30-00",
      city: "Bogotá",
      estimated_offset_hours: 0,
    })

    expect((capturedBody as Record<string, unknown>).latitude).toBeUndefined()
    expect((capturedBody as Record<string, unknown>).longitude).toBeUndefined()
  })
})

// ─── updateStop ───────────────────────────────────────────────────────────────

describe("routesApi.updateStop", () => {
  it("hace PATCH /routes/:routeId/stops/:stopId/ y retorna RouteStop actualizada", async () => {
    const updated = { ...mockStop, city: "Pereira" }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/routes/1/stops/10/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await routesApi.updateStop(1, 10, { city: "Pereira" })
    expect(data.city).toBe("Pereira")
    expect(capturedBody).toMatchObject({ city: "Pereira" })
  })
})

// ─── deleteStop ───────────────────────────────────────────────────────────────

describe("routesApi.deleteStop", () => {
  it("hace DELETE /routes/:routeId/stops/:stopId/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/routes/1/stops/10/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(routesApi.deleteStop(1, 10)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })
})
