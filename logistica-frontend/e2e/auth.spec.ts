import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// Casos sin sesión previa — NO usa el storageState del proyecto chromium
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Auth — sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login válido → redirige a /dashboard y muestra Sidebar + Navbar", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.locator('input[name="username"]').fill(USERNAME);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });

    // Navbar: header con el título de página
    const navbar = page.locator("header").first();
    await expect(navbar).toBeVisible();

    // Sidebar: aside con el branding "Logística" y enlace Dashboard
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText("Logística").first()).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("credenciales inválidas → mensaje de error, URL permanece en /login", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.locator('input[name="username"]').fill("usuario_invalido_xyz");
    await page.locator('input[name="password"]').fill("clave_incorrecta_xyz");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(
      page.getByText("Usuario o contraseña incorrectos.")
    ).toBeVisible({ timeout: 8_000 });

    expect(page.url()).toContain("/login");
  });

  test("sin token en localStorage → /warehouses redirige a /login", async ({
    page,
  }) => {
    // Las rutas (dashboard) no llevan prefijo /dashboard en la URL
    await page.goto("/warehouses");

    await page.waitForURL("**/login**", { timeout: 12_000 });
    expect(page.url()).toContain("/login");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Casos con sesión activa — usa storageState del proyecto chromium
// (inyectado por el setup en playwright/.auth/user.json)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Auth — con sesión activa", () => {
  test("logout → limpia tokens y redirige a /login; reintentar /dashboard redirige a /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Abre el menú de usuario en la Navbar
    await page
      .getByRole("button", { name: "Menú de usuario" })
      .click();

    // Hace clic en "Cerrar sesión" dentro del dropdown
    await page
      .getByRole("menuitem", { name: "Cerrar sesión" })
      .click();

    await page.waitForURL("**/login**", { timeout: 8_000 });
    expect(page.url()).toContain("/login");

    // Verificar que tokens fueron limpiados
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("logistica_access_token")
    );
    expect(accessToken).toBeNull();

    // Reintentar /dashboard → AuthGuard redirige a /login
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 8_000 });
    expect(page.url()).toContain("/login");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Avanzado: refresco de token
// access token inválido + refresh válido → interceptor refresca y NO expulsa
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Auth — refresco de token (avanzado)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("access token inválido + refresh válido → request se reintenta tras refresh, usuario permanece en dashboard", async ({
    page,
    request,
  }) => {
    // Obtener par de tokens real desde la API
    const tokenRes = await request.post(`${API_URL}/auth/token/`, {
      data: { username: USERNAME, password: PASSWORD },
    });

    if (!tokenRes.ok()) {
      test.skip(
        true,
        `API no disponible o credenciales inválidas (${tokenRes.status()})`
      );
      return;
    }

    const { refresh } = await tokenRes.json();

    // Inyectar access token falso + refresh token real en localStorage
    await page.goto("/login");
    await page.evaluate(
      ({ refreshToken }) => {
        // Token falso que provoca 401 en el servidor pero pasa el AuthGuard local
        localStorage.setItem(
          "logistica_access_token",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmYWtlIjp0cnVlfQ.invalidsignature"
        );
        localStorage.setItem("logistica_refresh_token", refreshToken);
      },
      { refreshToken: refresh }
    );

    // Navegar a una página protegida con datos del servidor
    await page.goto("/warehouses");

    // El interceptor axios debe detectar el 401, refrescar, reintentar.
    // Usuario NO debe terminar en /login.
    await page.waitForTimeout(1_000);
    expect(page.url()).not.toContain("/login");

    // Esperar con polling hasta que localStorage refleje el nuevo access token
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            localStorage.getItem("logistica_access_token")
          ),
        { timeout: 10_000 }
      )
      .not.toContain("invalidsignature");
  });
});
