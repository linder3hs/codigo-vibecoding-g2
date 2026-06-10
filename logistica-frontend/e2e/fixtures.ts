import { test as base, request as baseRequest } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

interface ApiFixture {
  /** POST a `${API_URL}/${endpoint}/` con payload. Retorna el id creado. */
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<string | number>;
  /** DELETE `${API_URL}/${endpoint}/${id}/` */
  remove: (endpoint: string, id: string | number) => Promise<void>;
  /** GET `${API_URL}/${endpoint}/` con params opcionales */
  list: (endpoint: string, params?: Record<string, string>) => Promise<unknown[]>;
}

export const test = base.extend<{ api: ApiFixture }>({
  api: async ({}, use) => {
    // Sin baseURL — se construyen URLs absolutas para evitar problemas de resolución
    const ctx = await baseRequest.newContext();

    const tokenRes = await ctx.post(`${API_URL}/auth/token/`, {
      data: { username: USERNAME, password: PASSWORD },
    });
    if (!tokenRes.ok()) {
      throw new Error(`API fixture: login falló (${tokenRes.status()})`);
    }
    const { access } = await tokenRes.json();

    const authHeaders = { Authorization: `Bearer ${access}` };

    const api: ApiFixture = {
      async seed(endpoint, payload) {
        const res = await ctx.post(`${API_URL}/${endpoint}/`, {
          data: payload,
          headers: authHeaders,
        });
        if (!res.ok()) {
          throw new Error(
            `seed(${endpoint}) falló (${res.status()}): ${await res.text()}`
          );
        }
        const body = await res.json();
        return body.id;
      },

      async remove(endpoint, id) {
        const res = await ctx.delete(`${API_URL}/${endpoint}/${id}/`, {
          headers: authHeaders,
        });
        // 204 No Content o 404 son aceptables en cleanup
        if (!res.ok() && res.status() !== 404) {
          throw new Error(`remove(${endpoint}/${id}) falló (${res.status()})`);
        }
      },

      async list(endpoint, params) {
        const url = params
          ? `${API_URL}/${endpoint}/?${new URLSearchParams(params)}`
          : `${API_URL}/${endpoint}/`;
        const res = await ctx.get(url, { headers: authHeaders });
        if (!res.ok()) {
          throw new Error(`list(${endpoint}) falló (${res.status()})`);
        }
        const body = await res.json();
        return Array.isArray(body) ? body : (body.results ?? []);
      },
    };

    await use(api);
    await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
