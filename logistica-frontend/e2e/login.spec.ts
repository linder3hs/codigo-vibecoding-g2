import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

// Este spec NO usa el storageState del proyecto "chromium":
// necesita el formulario de login, no sesión pre-inyectada.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login válido redirige a /dashboard", async ({ page }) => {
    await page.getByLabel("Usuario").fill(USERNAME);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("credenciales inválidas muestran mensaje de error", async ({ page }) => {
    await page.getByLabel("Usuario").fill("usuario_inexistente");
    await page.getByLabel("Contraseña").fill("clave_incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(
      page.getByText("Usuario o contraseña incorrectos.")
    ).toBeVisible({ timeout: 8_000 });
  });
});
