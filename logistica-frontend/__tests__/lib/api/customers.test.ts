import { afterEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { customerApi } from "@/lib/api/customers"
import type { Customer, CustomerCreate } from "@/types/customer"
import type { PaginatedResponse } from "@/types/common"

const BASE = "http://localhost:8000/api/v1"

afterEach(() => localStorage.clear())

// ─── fixtures ──────────────────────────────────────────────────────────────────

const mockCustomer: Customer = {
  id: 1,
  name: "Acme Corp",
  customer_type: "COMPANY",
  tax_id: "900123456-1",
  email: "acme@example.com",
  phone: "+57 300 0000001",
  address: "Calle 100 #10-20",
  city: "Bogotá",
  country: "Colombia",
  is_active: true,
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
}

const mockPaginated: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
}

// ─── list ──────────────────────────────────────────────────────────────────────

describe("customerApi.list", () => {
  it("hace GET /customers/ y retorna PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/customers/`, () => HttpResponse.json(mockPaginated)),
    )

    const data = await customerApi.list()
    expect(data.count).toBe(1)
    expect(data.results[0].name).toBe("Acme Corp")
  })

  it("pasa search y page como query string", async () => {
    let captured: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        captured = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await customerApi.list({ search: "acme", page: 2 })

    expect(captured!.get("search")).toBe("acme")
    expect(captured!.get("page")).toBe("2")
  })

  it("pasa customer_type como filtro", async () => {
    let captured: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        captured = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await customerApi.list({ customer_type: "COMPANY" })
    expect(captured!.get("customer_type")).toBe("COMPANY")
  })

  it("sin params no envía query string", async () => {
    let captured: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        captured = new URL(request.url).searchParams
        return HttpResponse.json(mockPaginated)
      }),
    )

    await customerApi.list()
    expect(captured!.toString()).toBe("")
  })
})

// ─── get ───────────────────────────────────────────────────────────────────────

describe("customerApi.get", () => {
  it("hace GET /customers/:id/ y retorna Customer", async () => {
    server.use(
      http.get(`${BASE}/customers/1/`, () => HttpResponse.json(mockCustomer)),
    )

    const data = await customerApi.get(1)
    expect(data.id).toBe(1)
    expect(data.name).toBe("Acme Corp")
  })

  it("propaga error 404", async () => {
    server.use(
      http.get(`${BASE}/customers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(customerApi.get(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ────────────────────────────────────────────────────────────────────

describe("customerApi.create", () => {
  it("hace POST /customers/ con payload y retorna Customer creado", async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/customers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockCustomer, { status: 201 })
      }),
    )

    const payload: CustomerCreate = {
      name: "Acme Corp",
      customer_type: "COMPANY",
      email: "acme@example.com",
      phone: "+57 300 0000001",
      address: "Calle 100 #10-20",
      city: "Bogotá",
      country: "Colombia",
    }

    const data = await customerApi.create(payload)
    expect(data.id).toBe(1)
    expect(capturedBody).toMatchObject({ name: "Acme Corp", customer_type: "COMPANY" })
  })

  it("propaga error 400 de validación", async () => {
    server.use(
      http.post(`${BASE}/customers/`, () =>
        HttpResponse.json({ email: ["Ya existe un cliente con este email."] }, { status: 400 }),
      ),
    )

    await expect(
      customerApi.create({
        name: "X",
        customer_type: "COMPANY",
        email: "dup@example.com",
        phone: "123",
        address: "X",
        city: "X",
        country: "X",
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ────────────────────────────────────────────────────────────────────

describe("customerApi.update", () => {
  it("hace PATCH /customers/:id/ y retorna Customer actualizado", async () => {
    const updated = { ...mockCustomer, name: "Acme Corp Updated" }

    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE}/customers/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(updated)
      }),
    )

    const data = await customerApi.update(1, { name: "Acme Corp Updated" })
    expect(data.name).toBe("Acme Corp Updated")
    expect(capturedBody).toMatchObject({ name: "Acme Corp Updated" })
  })
})

// ─── remove ────────────────────────────────────────────────────────────────────

describe("customerApi.remove", () => {
  it("hace DELETE /customers/:id/ y resuelve sin valor", async () => {
    let deleted = false

    server.use(
      http.delete(`${BASE}/customers/1/`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(customerApi.remove(1)).resolves.toBeUndefined()
    expect(deleted).toBe(true)
  })

  it("propaga error 404", async () => {
    server.use(
      http.delete(`${BASE}/customers/999/`, () =>
        HttpResponse.json({ detail: "No encontrado." }, { status: 404 }),
      ),
    )

    await expect(customerApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
