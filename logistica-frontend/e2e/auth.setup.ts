import { test as setup } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join("playwright", ".auth", "user.json");

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const USERNAME = process.env.E2E_USERNAME ?? "testuser";
const PASSWORD = process.env.E2E_PASSWORD ?? "testpass123";

setup("autenticar usuario de test", async ({ page, request }) => {
  // Obtiene tokens directamente de la API — más rápido y estable que UI
  const res = await request.post(`${API_URL}/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  });

  if (!res.ok()) {
    throw new Error(`Login API falló (${res.status()}): ${await res.text()}`);
  }

  const { access, refresh } = await res.json();

  // Navega al origen para poder escribir en su localStorage
  await page.goto("/login");

  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem("logistica_access_token", accessToken);
      localStorage.setItem("logistica_refresh_token", refreshToken);
    },
    { accessToken: access, refreshToken: refresh },
  );

  // Persiste el storage state (localStorage + cookies) del origen
  await page.context().storageState({ path: AUTH_FILE });
});
