import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { supplierApi } from "@/lib/api/suppliers"
import type { Supplier, SupplierCreate } from "@/types/supplier"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

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

// ─── list ──────────────────────────────────────────────────────────────────────

describe("supplierApi.list", () => {
  it("hace GET /suppliers/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/suppliers/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await supplierApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].name).toBe("Distribuidora Norte")
    expect(data.results[0].contact_name).toBe("Juan Pérez")
  })

  it("pasa search y page como query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await supplierApi.list({ search: "norte", page: 3 })

    expect(qs!.get("search")).toBe("norte")
    expect(qs!.get("page")).toBe("3")
  })

  it("pasa city y country como filtros", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await supplierApi.list({ city: "Bogotá", country: "Colombia" })

    expect(qs!.get("city")).toBe("Bogotá")
    expect(qs!.get("country")).toBe("Colombia")
  })

  it("pasa ordering como parámetro", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await supplierApi.list({ ordering: "-name" })
    expect(qs!.get("ordering")).toBe("-name")
  })

  it("sin params no envía query string", async () => {
    let qs: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/suppliers/`, ({ request }) => {
        qs = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await supplierApi.list()
    expect(qs!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("supplierApi.get", () => {
  it("hace GET /suppliers/:id/ y retorna Supplier", async () => {
    server.use(
      http.get(`${BASE}/suppliers/5/`, () => HttpResponse.json(mockSupplier)),
    )

    const data = await supplierApi.get(5)
    expect(data.id).toBe(5)
    expect(data.name).toBe("Distribuidora Norte")
    expect(data.contact_name).toBe("Juan Pérez")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/suppliers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(supplierApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("supplierApi.create", () => {
  it("hace POST /suppliers/ con payload y retorna Supplier creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockSupplier, { status: 201 })
      }),
    )

    const payload: SupplierCreate = {
      name: "Distribuidora Norte",
      contact_name: "Juan Pérez",
      email: "juan@norte.com",
      phone: "+57 300 1111111",
      address: "Calle 100 #10-20",
      city: "Bogotá",
      country: "Colombia",
    }

    const data = await supplierApi.create(payload)
    expect(data.id).toBe(5)
    expect(capturedBody).toMatchObject({
      name: "Distribuidora Norte",
      contact_name: "Juan Pérez",
    })
  })

  it("crea sin tax_id (campo opcional)", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/suppliers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSupplier, tax_id: null }, { status: 201 })
      }),
    )

    await supplierApi.create({
      name: "Sin NIT",
      contact_name: "Ana López",
      email: "ana@test.com",
      phone: "300 000 000",
      address: "Cra 1",
      city: "Cali",
      country: "Colombia",
    })

    expect((capturedBody as Record<string, unknown>).tax_id).toBeUndefined()
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/suppliers/`, () =>
        HttpResponse.json(
          { email: ["Ya existe un proveedor con este email."] },
          { status: 400 },
        ),
      ),
    )

    await expect(
      supplierApi.create({
        name: "X",
        contact_name: "X",
        email: "dup@test.com",
        phone: "123",
        address: "X",
        city: "X",
        country: "X",
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("supplierApi.update", () => {
  it("hace PATCH /suppliers/:id/ y retorna Supplier actualizado", async () => {
    const updated = { ...mockSupplier, contact_name: "Pedro Gómez" }
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/suppliers/5/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await supplierApi.update(5, { contact_name: "Pedro Gómez" })
    expect(data.contact_name).toBe("Pedro Gómez")
    expect(capturedBody).toMatchObject({ contact_name: "Pedro Gómez" })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("supplierApi.remove", () => {
  it("hace DELETE /suppliers/:id/ y resuelve sin valor (204)", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/suppliers/5/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(supplierApi.remove(5)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/suppliers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(supplierApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
