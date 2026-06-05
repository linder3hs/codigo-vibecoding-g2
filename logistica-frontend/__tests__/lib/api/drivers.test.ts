import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { driversApi } from "@/lib/api/drivers"
import type { Driver, DriverCreate } from "@/types/driver"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("driversApi.list", () => {
  it("hace GET /drivers/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/drivers/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await driversApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].user_full_name).toBe("Carlos Ramírez")
    expect(data.results[0].license_number).toBe("LIC-001234")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await driversApi.list({ search: "carlos", page: 2 })

    expect(qs!.get("search")).toBe("carlos")
    expect(qs!.get("page")).toBe("2")
  })

  it("pasa transport como filtro numérico", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await driversApi.list({ transport: 2 })
    expect(qs!.get("transport")).toBe("2")
  })

  it("pasa is_active como filtro booleano", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await driversApi.list({ is_active: false })
    expect(qs!.get("is_active")).toBe("false")
  })

  it("pasa ordering como parámetro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await driversApi.list({ ordering: "-license_expiry" })
    expect(qs!.get("ordering")).toBe("-license_expiry")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/drivers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await driversApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("driversApi.get", () => {
  it("hace GET /drivers/:id/ y retorna Driver", async () => {
    server.use(
      http.get(`${BASE}/drivers/4/`, () => HttpResponse.json(mockDriver)),
    )

    const data = await driversApi.get(4)
    expect(data.id).toBe(4)
    expect(data.user_full_name).toBe("Carlos Ramírez")
    expect(data.license_expiry).toBe("2027-06-30")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/drivers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(driversApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("driversApi.create", () => {
  it("hace POST /drivers/ con payload completo y retorna Driver creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockDriver, { status: 201 })
      }),
    )

    const payload: DriverCreate = {
      user: 8,
      license_number: "LIC-001234",
      license_expiry: "2027-06-30",
      phone: "+57 310 000 0000",
      transport: 2,
      is_active: true,
    }

    const data = await driversApi.create(payload)
    expect(data.id).toBe(4)
    expect(capturedBody).toMatchObject({
      user: 8,
      license_number: "LIC-001234",
      license_expiry: "2027-06-30",
      transport: 2,
      is_active: true,
    })
  })

  it("crea con transport=null (sin transporte asignado)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockDriver, transport: null }, { status: 201 })
      }),
    )

    await driversApi.create({
      user: 9,
      license_number: "LIC-009999",
      license_expiry: "2028-01-01",
      phone: "+57 320 111 1111",
      transport: null,
      is_active: true,
    })

    expect((capturedBody as Record<string, unknown>).transport).toBeNull()
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/drivers/`, () =>
        HttpResponse.json(
          { license_number: ["Ya existe un conductor con este número de licencia."] },
          { status: 400 },
        ),
      ),
    )

    await expect(
      driversApi.create({
        user: 8,
        license_number: "LIC-001234",
        license_expiry: "2027-06-30",
        phone: "+57 310 000 0000",
        transport: null,
        is_active: true,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("driversApi.update", () => {
  it("hace PATCH /drivers/:id/ y retorna Driver actualizado", async () => {
    const updated = { ...mockDriver, phone: "+57 315 999 9999" }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/drivers/4/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await driversApi.update(4, { phone: "+57 315 999 9999" })
    expect(data.phone).toBe("+57 315 999 9999")
    expect(capturedBody).toMatchObject({ phone: "+57 315 999 9999" })
  })

  it("actualiza transport a null (desasignar transporte)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/drivers/4/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockDriver, transport: null })
      }),
    )

    const data = await driversApi.update(4, { transport: null })
    expect(data.transport).toBeNull()
    expect((capturedBody as Record<string, unknown>).transport).toBeNull()
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("driversApi.remove", () => {
  it("hace DELETE /drivers/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/drivers/4/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(driversApi.remove(4)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/drivers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(driversApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
