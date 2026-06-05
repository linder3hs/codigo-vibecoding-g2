/**
 * Tests del interceptor de axiosInstance.
 *
 * Usa el servidor MSW global (test/msw/server.ts) iniciado en test/setup.ts.
 * Cada test agrega handlers temporales via server.use(); el afterEach de setup.ts
 * los limpia con server.resetHandlers().
 *
 * NO crea un servidor MSW local para evitar doble-intercepción con el global.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import axiosInstance from "@/lib/axios";

const PROTECTED = "http://localhost:8000/api/v1/protected/";
const REFRESH_URL = "http://localhost:8000/api/v1/auth/token/refresh/";
const ACCESS_KEY = "logistica_access_token";
const REFRESH_KEY = "logistica_refresh_token";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── helpers ───────────────────────────────────────────────────────────────────

/** Reemplaza window.location con un objeto controlable manteniendo href válido. */
function stubLocation(initialHref = "http://localhost:3000/") {
  const mock = { href: initialHref };
  vi.stubGlobal("location", mock);
  return mock;
}

// ─── Request interceptor ───────────────────────────────────────────────────────

describe("request interceptor", () => {
  it("agrega Authorization header cuando existe access token", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get(PROTECTED, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    localStorage.setItem(ACCESS_KEY, "my-access-token");
    await axiosInstance.get(PROTECTED);

    expect(capturedAuth).toBe("Bearer my-access-token");
  });

  it("NO agrega Authorization header cuando no hay access token", async () => {
    let capturedAuth: string | null = "sentinel";

    server.use(
      http.get(PROTECTED, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await axiosInstance.get(PROTECTED);

    expect(capturedAuth).toBeNull();
  });
});

// ─── Response interceptor — 401 con refresh válido ────────────────────────────

describe("response interceptor — 401 con refresh válido", () => {
  it("llama a /auth/token/refresh/, guarda nuevo token y reintenta con éxito", async () => {
    localStorage.setItem(ACCESS_KEY, "expired-access");
    localStorage.setItem(REFRESH_KEY, "valid-refresh");

    let callCount = 0;
    let retryAuthHeader: string | null = null;

    server.use(
      http.get(PROTECTED, ({ request }) => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        retryAuthHeader = request.headers.get("authorization");
        return HttpResponse.json({ data: "secret" });
      }),

      http.post(REFRESH_URL, () => {
        return HttpResponse.json({ access: "new-access-token" });
      }),
    );

    const response = await axiosInstance.get(PROTECTED);

    // nuevo token guardado en localStorage
    expect(localStorage.getItem(ACCESS_KEY)).toBe("new-access-token");
    // reintento usó el token nuevo
    expect(retryAuthHeader).toBe("Bearer new-access-token");
    // respuesta llegó correctamente
    expect(response.data).toEqual({ data: "secret" });
    // 2 llamadas al endpoint: la original (401) + el reintento
    expect(callCount).toBe(2);
  });
});

// ─── Response interceptor — 401 sin refresh token ─────────────────────────────

describe("response interceptor — 401 sin refresh token", () => {
  it("limpia tokens y redirige a /login", async () => {
    localStorage.setItem(ACCESS_KEY, "expired-access");
    // sin refresh token

    const locationMock = stubLocation();

    server.use(
      http.get(PROTECTED, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(axiosInstance.get(PROTECTED)).rejects.toMatchObject({
      response: { status: 401 },
    });

    // tokens limpiados
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    // redirigido a login
    expect(locationMock.href).toBe("/login");
  });
});

// ─── Response interceptor — 401 con refresh fallido ───────────────────────────

describe("response interceptor — 401 con refresh fallido", () => {
  it("limpia tokens y redirige a /login cuando el refresh falla", async () => {
    localStorage.setItem(ACCESS_KEY, "expired-access");
    localStorage.setItem(REFRESH_KEY, "bad-refresh");

    const locationMock = stubLocation();

    server.use(
      http.get(PROTECTED, () => new HttpResponse(null, { status: 401 })),
      http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(axiosInstance.get(PROTECTED)).rejects.toBeDefined();

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(locationMock.href).toBe("/login");
  });
});

// ─── Flag _retry previene bucle infinito ──────────────────────────────────────

describe("flag _retry", () => {
  it("no llama a /auth/token/refresh/ más de una vez para un solo 401", async () => {
    localStorage.setItem(ACCESS_KEY, "expired");
    localStorage.setItem(REFRESH_KEY, "valid-refresh");

    let refreshCallCount = 0;

    server.use(
      // siempre 401 — el reintento también falla → entra al bloque _retry=true → rechaza
      http.get(PROTECTED, () => new HttpResponse(null, { status: 401 })),
      http.post(REFRESH_URL, () => {
        refreshCallCount++;
        return HttpResponse.json({ access: "refreshed-token" });
      }),
    );

    await expect(axiosInstance.get(PROTECTED)).rejects.toBeDefined();

    // refresh llamado exactamente una vez
    expect(refreshCallCount).toBe(1);
  });
});
