/**
 * Prerequisitos para correr los tests E2E:
 *
 *   1. Backend Django corriendo en :8000
 *      cd ../logistica-api && python manage.py runserver
 *
 *   2. Frontend Next.js corriendo en :3000
 *      npm run dev  (en este directorio)
 *
 *   3. Usuario de test existente en la BD:
 *      python manage.py shell -c "
 *        from django.contrib.auth import get_user_model
 *        U = get_user_model()
 *        U.objects.create_superuser('testuser', 'test@example.com', 'testpass123')
 *      "
 *
 *   Variables de entorno opcionales:
 *      E2E_BASE_URL   (default: http://localhost:3000)
 *      E2E_USERNAME   (default: testuser)
 *      E2E_PASSWORD   (default: testpass123)
 *      E2E_API_URL    (default: http://localhost:8000/api/v1)
 *
 *   Los servidores se levantan manualmente — NO se usan webServer aquí.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
